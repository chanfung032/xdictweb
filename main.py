# vi: filetype=python

import json
import os
import re
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

_orig_reconnect = tornado.database.Connection.reconnect
def _reconnect(self):
    self._db_args['init_command'] = 'SET time_zone = "+8:00"'
    return _orig_reconnect(self)
tornado.database.Connection.reconnect = _reconnect

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

class HowtoHandler(BaseHandler):
    def get(self):
        uid = self.get_current_uid()
        if not uid:
            self.redirect(self.get_login_url())
            return

        row = self.db.get("""
            select accesskey from users where weibo_uid = %s
        """, uid)
        key = row.accesskey if row else None
        if not key:
            key = _build_accesskey()
            self.db.execute("""
                insert into users(weibo_uid, accesskey)
                values(%s, %s)
            """, uid, key)

        template_file = os.path.join(os.path.dirname(__file__), 
                                     'templates', 'howto.html')
        self.render(template_file, accesskey=key)

class LogoutHandler(tornado.web.RequestHandler):
    def get(self):
        self.clear_all_cookies()
        self.redirect('/')

class FrontPageHandler(BaseHandler):
    def get(self):
        u = self.current_user
        if u:
            user_agent = self.request.headers.get('User-Agent')
            if re.search('Android|iPhone', user_agent):
                html_file = os.path.join(os.path.dirname(__file__),
                                         'templates', 'mobile.html')
                self.write(open(html_file).read())
            else:
                template_file = os.path.join(os.path.dirname(__file__),
                                             'templates', 'desktop.html')
                self.write(open(template_file).read())
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
            uid = self.get_current_uid()
            if not uid:
                self.send_error(403)
                return

            params = json.loads(self.request.body.decode('utf-8'))
            print 'params', params
            try:
                getattr(self, '_' + name)(uid, **params)
            except AttributeError:
                self.send_response(1, "unknown api")
            return

        uid = self.key_to_uid(k)
        if not uid:
            self.send_response(1, "invalid key")

        print uid
        try:
            getattr(self, '_' + name)(uid)
        except AttributeError:
            self.send_response(1, "unknown api")

    def options(self, name):
        self.set_header('Access-Control-Allow-Method', 'POST')
        self.set_header('Access-Control-Allow-Headers', 'origin, content-type')
        self.set_header('Access-Control-Allow-Origin', '*')

    def key_to_uid(self, key):
        row = self.db.get("""
            select weibo_uid from users where accesskey = %s
        """, key)
        return row.weibo_uid if row else None

    def send_response(self, code, data, handler=None):
        self.write(json.dumps(dict(code=code, data=data), default=handler))

    def _list(self, uid, start=None, limit=10000, fill_if_empty=False):
        words = self.db.query("""
            select * from wordlist s
            where s.weibo_uid = %s and s.hits > 0
            order by s.updated_at desc, s.hits desc, s.id
            limit %s
        """, uid, int(limit))
        if fill_if_empty and len(words) == 0:
            r = self.db.get('''
                select min(recites) as r from wordlist where recites >= 6 and weibo_uid = %s
            ''', uid).r
            words = self.db.query("""
                SELECT * FROM wordlist where weibo_uid = %s and hits < 0 and recites = %s ORDER BY RAND() LIMIT %s
            """, uid, r, int(limit))

        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _review(self, uid, start=0, limit=10000):
        words = self.db.query("""
            select id,word,phonetic,meaning,abs(hits) as hits,recites from wordlist s
            where s.weibo_uid = %s and s.hits < 0 and datediff(now(), updated_at) = 0
            order by updated_at desc
            limit %s, %s
        """, uid, int(start), int(limit))
        #random.shuffle(words)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _sy(self, uid):
        words = self.db.query("""
            select word,phonetic,sy as meaning,abs(hits) as hits,recites from wordlist s
            where s.weibo_uid = %s and s.hits < 0 and datediff(now(), updated_at) = 0
            order by updated_at desc
        """, uid)
        #random.shuffle(words)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _like(self, uid, word):
        words = self.db.query("""
            select * from wordlist where word sounds like %s and word <> %s
        """, word, word)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _delete(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")
        self.db.execute("""
            delete from wordlist where id = %s and weibo_uid = %s
        """, id, uid)
        self.send_response(0, "ok")

    def _update(self, uid, word, **kws):
        id_ = kws.get('id', -1)
        if id_ != -1:
            self.db.execute('''
                update wordlist set word=%s, phonetic=%s, meaning=%s where id=%s
            ''', word, kws.get('phonetic', ''), kws.get('meaning', ''), kws.get('id'))
        else:
            id_ = self.db.execute_lastrowid('''
                insert into wordlist(weibo_uid, word, phonetic, meaning, sy, rel, hits, recites)
                values(%s, %s, %s, %s, '', '', 1, 0)
                on duplicate key update phonetic=%s, meaning=%s, hits=abs(hits), recites=0
            ''', uid, word, kws.get('phonetic', ''), kws.get('meaning', ''), kws.get('phonetic', ''), kws.get('meaning', ''))
        self.send_response(0, id_)

    def _ok(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")

        self.db.execute("""
            update wordlist
            set hits = 0 - abs(hits), recites = recites + if(recites < 6, 0, 1)
            where id = %s and weibo_uid = %s
        """, id, uid)
        self.send_response(0, "ok")

    def _forget(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")

        self.db.execute("""
            update wordlist set hits = abs(hits), recites = 0 where id = %s and weibo_uid = %s
        """, id, uid)
        self.send_response(0, "ok")

    def _info(self, uid):
        if id is None:
            self.send_response(1, "invalid request")
        info = self.db.query('''
            select recites, count(1) as count from wordlist where weibo_uid = %s group by recites
        ''', uid)
        self.send_response(0, info)

    def _add(self, uid):
        self.set_header('Access-Control-Allow-Origin', self.request.headers.get('origin'))
        def sy(d):
            x = []
            try:
                for e in d['synonyms'][0]['entries']:
                    label = ','.join([i['text'] for i in e['labels']])
                    terms = ' '.join([i['text'] for i in e['terms']])
                    x.append(label + ': ' + terms)
                return '; '.join(x)
            except Exception, e:
                print d, e
                return ''

        try:
            d = json.loads(self.request.body)
        except:
            self.send_response(1, "invalid request")
            return
        d = {k: re.sub(r'\s+', ' ', v.strip()) if type(v) == unicode else v for k, v in d.iteritems()}

        rc = self.db.get("""
                select hits from wordlist s
                where s.word = %s and weibo_uid = %s
            """, d['word'], uid)
        if rc is None:
            phonetic = self.get_phonetic(d['word'])
            self.db.execute("""
                insert into wordlist(weibo_uid,word,meaning,phonetic,hits,sy)
                values(%s, %s, %s, %s, 1, %s)
            """, uid, d['word'], d['meaning'], phonetic, sy(d))
        else:
            self.db.execute("""
                update wordlist set hits = abs(hits)+1, recites = 0
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

class CronHandler(BaseHandler):
    def get(self, job):
        n = self.db.execute_rowcount("""
            update wordlist set recites = recites - 1
            where recites > 1 and hits > 0 and datediff(now(), updated_at) > 7
        """)
        self.write('%s word(s) downgraded' % n)

        import time
        time.sleep(1)

        n = 0
        for i in reversed(range(6)):
            n += self.db.execute_rowcount("""
                update wordlist set hits = abs(hits), recites = recites+1
                where hits < 0 and recites = %s and datediff(now(), updated_at) % 33 = %s
            """, i, 2**i)
            time.sleep(1)
        self.write(', %s word(s) updated for review' % n)


settings = {
  "debug": True,
  "cookie_secret": "0xdeadbeef",
  "static_path": os.path.join(os.path.dirname(__file__), "static"),
}

app = tornado.wsgi.WSGIApplication([
    (r"/", FrontPageHandler),
    (r"/api/(.*)", RpcHandler),
    (r"/login", LoginHandler),
    (r"/logout", LogoutHandler),
    (r"/howto", HowtoHandler),
    (r"/cron/(.*)", CronHandler),
], **settings)


if __name__ == '__main__':
    import wsgiref.simple_server
    httpd = wsgiref.simple_server.make_server('', 8080, app)
    httpd.serve_forever()

