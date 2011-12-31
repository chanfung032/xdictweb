# vi: filetype=python

import json
import os
import string
import random
import datetime
import urllib
import urllib2
import xml.dom.minidom
import weibo
import tornado.web
import tornado.wsgi
import tornado.database

from sae.const import (MYSQL_HOST, MYSQL_HOST_S,
    MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB
)

APP_KEY = '2426835332'
APP_SECRET = '594f4a061b1a481ce4e030fbd88681f9'

callback = 'http://xdictweb.sinaapp.com/login'
oauth = weibo.APIClient(APP_KEY, APP_SECRET, callback)

def _build_accesskey():
    return ''.join([random.choice(string.letters) for n in range(40)])

class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return tornado.database.Connection(
            #'localhost:3306', 'app_xdictweb', 'root', 'root'
            ':'.join([MYSQL_HOST, MYSQL_PORT]), MYSQL_DB, MYSQL_USER, MYSQL_PASS
        )
        
    def get_current_user(self):
        k = self.get_secure_cookie('accesskey')
        if not k: 
            return None

        token, expires = k.split(',')
        oauth.set_access_token(token, int(expires))
        if oauth.is_expires():
            return None

        uid = oauth.get.account__get_uid().uid
        screen_name = oauth.get.users__show(uid=uid).screen_name
        return dict(uid=uid, name=screen_name)

    def get_current_uid(self):
        u = self.get_secure_cookie('u')
        return int(u) if u else None

    def get_login_url(self):
        return oauth.get_authorize_url()

class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        code = self.get_argument('code')
        t = oauth.request_access_token(code)
        oauth.set_access_token(t.access_token, t.expires_in)
        uid = oauth.get.account__get_uid().uid
        info = oauth.get.users__show(uid=uid)

        self.set_secure_cookie('u', str(uid))
        k = ','.join([t.access_token, str(t.expires_in)])
        self.set_secure_cookie('accesskey', k)

        self.redirect('/')

class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.redirect('/')

class FrontPageHandler(BaseHandler):
    def get(self):
        u = self.current_user
        if u:
            template_file = os.path.join(os.path.dirname(__file__), 
                                         'templates', 'index.html')
            self.render(template_file, **u)
        else:
            self.redirect(self.get_login_url())
        
class RpcHandler(BaseHandler):
    def get(self, name):
        uid = self.get_current_uid()
        if not uid:
            self.send_error(403)
            return

        qs = self.request.arguments
        params = {}
        for k, v in qs.iteritems():
            params[k] = v[0]

        try:
            getattr(self, '_' + name)(uid, **params)
        except AttributeError:
            self.send_response(1, "unknown api")

    def post(self, name):
        k = self.get_argument('key', None)
        if not k:
            self.send_error(403)

        uid = self.key_to_uid(k)
        if not uid:
            self.send_response(1, "invalid key")

        print uid
        try:
            getattr(self, '_' + name)(uid)
        except AttributeError:
            self.send_response(1, "unknown api")

    def key_to_uid(self, key):
        row = self.db.get("""
            select weibo_uid from xd_users where accesskey = %s
        """, key)
        return row.weibo_uid if row else None

    def send_response(self, code, data, handler=None):
        self.write(json.dumps(dict(code=code, data=data), default=handler))

    def _list(self, uid):
        words = self.db.query("""
            select * from xd_wordlist s 
            where s.weibo_uid = %s order by s.update_time desc, s.hits desc
        """, uid)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _delete(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")

        self.db.execute("""
            delete from xd_wordlist where id = %s and weibo_uid = %s
        """, id, uid)
        self.send_response(0, "ok")

    def _add(self, uid):
        try:
            d = json.loads(self.request.body)
        except:
            self.send_response(1, "invalid request")
            return

        rc = self.db.get("""
                select hits from xd_wordlist s 
                where s.word = %s and weibo_uid = %s
            """, d['word'], uid)
        if rc is None:
            phonetic = self.get_phonetic(d['word'])
            self.db.execute("""
                insert into xd_wordlist(weibo_uid,word,meaning,phonetic,hits)
                values(%s, %s, %s, %s, 1)
            """, uid, d['word'], d['meaning'], phonetic)
        else:
            self.db.execute("""
                update xd_wordlist set hits = hits + 1 
                where word = %s and weibo_uid = %s
            """, d['word'], uid)
        self.send_response(0, "ok")

    def get_phonetic(self, word):
        # query youdao for phonetic
        qs = urllib.urlencode([('q', word),])
        url ='http://dict.youdao.com/fsearch?' + qs
        print url
        try:
            rep = urllib2.urlopen(url, None, 5).read()
            doc = xml.dom.minidom.parseString(rep)
            e = doc.getElementsByTagName('phonetic-symbol')[0]
            return e.childNodes[0].data
        except:
            return ''

settings = {
  "cookie_secret": "0xdeadbeef",
  "static_path": os.path.join(os.path.dirname(__file__), "static"),
}

app = tornado.wsgi.WSGIApplication([
    (r"/", FrontPageHandler),
    (r"/api/(.*)", RpcHandler),
    (r"/login", LoginHandler),
    (r"/logout", LogoutHandler),
], **settings)

try:
    import sae
    application = sae.create_wsgi_app(app)
except:
    import wsgiref.simple_server
    httpd = wsgiref.simple_server.make_server('', 8080, app)
    httpd.serve_forever()

