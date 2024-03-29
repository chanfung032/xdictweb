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
import base64
import imghdr
import weibo
import tornado.web
import tornado.wsgi
import tornado.database

from sae.const import (MYSQL_HOST, MYSQL_HOST_S,
    MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB
)

# `tornado.database` set timezone to +0:00, change it back
# See: https://github.com/tornadoweb/tornado/blob/branch2.1/tornado/database.py#L50
_orig_reconnect = tornado.database.Connection.reconnect
def _reconnect(self):
    self._db_args['init_command'] = 'SET time_zone = "+8:00"'
    return _orig_reconnect(self)
tornado.database.Connection.reconnect = _reconnect

APP_KEY = '2426835332'
APP_SECRET = '594f4a061b1a481ce4e030fbd88681f9'

callback = 'http://xdictweb.sinaapp.com/login'
oauth = weibo.APIClient(APP_KEY, APP_SECRET, callback)

# When a word's `recites` is bigger than this, it will be considered as remembered
GRAD_RECITES = 7

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

class LoginHandler(BaseHandler):
    def get(self):
        code = self.get_argument('code', None)
        if code:
            t = oauth.request_access_token(code)
            oauth.set_access_token(t.access_token, t.expires_in)
            uid = oauth.get.account__get_uid().uid
            info = oauth.get.users__show(uid=uid)

            self.set_secure_cookie('u', str(uid))
            k = ','.join([t.access_token, str(t.expires_in)])
            self.set_secure_cookie('accesskey', k)

            self.redirect('/')
        else:
            self.redirect(self.get_login_url())

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
            if re.search('iPhone', user_agent):
                html_file = os.path.join(os.path.dirname(__file__),
                                         'templates', 'mobile.html')
                self.write(open(html_file).read())
            else:
                self.redirect('/dist/index.html', permanent=True)
            #elif re.search('Android', user_agent):
            #    html_file = os.path.join(os.path.dirname(__file__),
            #                             'templates', 'mobile-vue.html')
            #    self.write(open(html_file).read())
            #else:
            #    template_file = os.path.join(os.path.dirname(__file__),
            #                                 'templates', 'desktop-vue.html')
            #    self.write(open(template_file).read())
        else:
            self.redirect(self.get_login_url())

class DirectHandler(BaseHandler):
    def get(self, uid):
        self.set_secure_cookie('u', str(uid))
        self.redirect('/dist/index.html')

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
        if code != 0:
            self.set_status(500)
            self.write(json.dumps({"error": data}))
        else:
            self.write(json.dumps(data, default=handler))

    def _list(self, uid, start=None, limit=10000, fill=False):
        words = self.db.query("""
            select id, word, phonetic, meaning, hits, recites, img is not null as img
            from words s left join word_imgs on s.id = word_imgs.word_id
            where s.weibo_uid = %s and s.hits > 0
            order by s.updated_at desc, s.hits desc, s.id
            limit %s
        """, uid, int(limit))
        if fill and len(words) == 0:
            r = self.db.get('''
                select min(recites) as r from words where recites >= %s and weibo_uid = %s
            ''', GRAD_RECITES, uid).r
            words = self.db.query("""
                SELECT id, word, phonetic, meaning, hits, recites, img is not null as img
                FROM words left join word_imgs on words.id = word_imgs.word_id
                where weibo_uid = %s and hits < 0 and recites = %s ORDER BY RAND() LIMIT %s
            """, uid, r, int(limit))

        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _review(self, uid, start=0, limit=10000):
        words = self.db.query("""
            select id,word,phonetic,meaning,abs(hits) as hits,recites, img is not null as img
            from words s left join word_imgs on s.id = word_imgs.word_id
            where s.weibo_uid = %s and s.hits < 0 and datediff(now(), updated_at) = 0
            order by updated_at desc
            limit %s, %s
        """, uid, int(start), int(limit))
        #random.shuffle(words)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _search(self, uid, k):
        words = self.db.query("""
            select id,word,phonetic,meaning,abs(hits) as hits,recites, img is not null as img
            from words s left join word_imgs on s.id = word_imgs.word_id
            where s.weibo_uid = %s and s.word like %s
            limit 10
        """, uid, '%%%s%%' % k)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _sy(self, uid):
        words = self.db.query("""
            select word,phonetic,sy as meaning,abs(hits) as hits,recites from words s
            where s.weibo_uid = %s and s.hits < 0 and datediff(now(), updated_at) = 0
            order by updated_at desc
        """, uid)
        #random.shuffle(words)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _like(self, uid, word):
        words = self.db.query("""
            select * from words where word sounds like %s and word <> %s
        """, word, word)
        h = lambda o: o.isoformat() \
                if isinstance(o, datetime.datetime) else None
        self.send_response(0, words, h)

    def _delete(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")
        self.db.execute("delete from word_imgs where word_id = %s", id)
        self.db.execute("""
            delete from words where id = %s and weibo_uid = %s
        """, id, uid)

    def _update(self, uid, word, **kws):
        id_ = kws.get('id', -1)
        if id_ != -1:
            self.db.execute('''
                update words set word=%s, phonetic=%s, meaning=%s where id=%s
            ''', word, kws.get('phonetic', ''), kws.get('meaning', ''), kws.get('id'))
        else:
            id_ = self.db.execute_lastrowid('''
                insert into words(weibo_uid, word, phonetic, meaning, sy, rel, hits, recites)
                values(%s, %s, %s, %s, '', '', 1, 0)
                on duplicate key update phonetic=%s, meaning=%s, hits=abs(hits), recites=0
            ''', uid, word, kws.get('phonetic', ''), kws.get('meaning', ''), kws.get('phonetic', ''), kws.get('meaning', ''))
        self.send_response(0, id_)

    def _upload(self, uid, id, url):
        if url == '':
            self.db.execute('delete from word_imgs where word_id = %s', id)
            return

        if url.startswith('http'):
            if url.find('.gstatic.com') != -1:
                url = 'http://rss-gen.herokuapp.com/p?url=' + urllib.quote(url)
            img = urllib2.urlopen(url, timeout=30).read()
        else:
            img = base64.b64decode(url.split(',')[-1])
        self.db.execute('''
            insert into word_imgs(word_id, img) values(%s, %s) on duplicate key update img=values(img)
        ''', id, img)

    def _ok(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")

        self.db.execute("""
            update words
            set hits = 0 - abs(hits), recites = recites + if(recites < %s, 0, 1)
            where id = %s and weibo_uid = %s
        """, GRAD_RECITES, id, uid)

    def _forget(self, uid, id=None):
        if id is None:
            self.send_response(1, "invalid request")

        self.db.execute("""
            update words set
                hits = abs(hits),
                difficulty = difficulty + if(recites >= %s and datediff(now(), updated_at) > 0, 1, 0),
                recites = 0
            where id = %s and weibo_uid = %s
        """, GRAD_RECITES, id, uid)

    def _info(self, uid):
        if id is None:
            self.send_response(1, "invalid request")
        info = self.db.query('''
            select recites, count(1) as count from words where weibo_uid = %s group by recites
        ''', uid)
        total = sum([i['count'] for i in info])
        graduated = sum([i['count'] for i in info if i['recites'] >= GRAD_RECITES])
        new = self.db.get('''
            select count(1) as count from words where weibo_uid = %s and datediff(now(), created_at) = 0
        ''', uid)['count']
        other = self.db.get('''
            select count(1) as count from words where weibo_uid = %s and word not regexp '^[a-zA-Z0-9[:punct:][:space:]_-]+$'
        ''', uid)['count']
        self.send_response(0, {"new": new, "other": other, "total": total, "graduated": graduated, "r2c": info})

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
                select hits from words s
                where s.word = %s and weibo_uid = %s
            """, d['word'], uid)
        if rc is None:
            phonetic = d['phonetic'] if 'phonetic' in d else self.get_phonetic(d['word'])
            self.db.execute("""
                insert into words(weibo_uid,word,meaning,phonetic,hits,sy)
                values(%s, %s, %s, %s, 1, %s)
            """, uid, d['word'], d['meaning'], phonetic, sy(d))
        else:
            self.db.execute("""
                update words set hits = abs(hits)+1, recites = 0
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

class ImgHandler(BaseHandler):
    def get(self, id):
        data = self.db.get('select img from word_imgs where word_id = %s', id)['img']
        ext = imghdr.what('', h=data)
        self.set_header('Content-Type', 'image/'+ext)
        self.set_header('Cache-Control', 'max-age=30758400')
        self.write(data)

#class AudioHandler(BaseHandler):
#    def get(self,  id):
#        data = self.db.get('select word from words where id = %s', id)['word']
#        r = urllib2.urlopen('http://dict.youdao.com/dictvoice?audio=%s&type=2' % urllib.quote(data))
#        self.set_status(200)
#        self.set_header('Content-Type', r.headers['content-type'])
#        self.set_header('Cache-Control', 'max-age=30758400')
#        self.write(r.read())

class CronHandler(BaseHandler):
    def get(self, job):
        #n = self.db.execute_rowcount("""
        #    update words set recites = recites - 1
        #    where recites > 1 and hits > 0 and datediff(now(), updated_at) > 7
        #""")
        #self.write('%s word(s) downgraded' % n)

        import time
        time.sleep(1)

        n = 0
        for i in reversed(range(GRAD_RECITES)):
            n += self.db.execute_rowcount("""
                update words set hits = abs(hits), recites = recites+1
                where hits < 0 and recites = %s and datediff(now(), updated_at) mod (pow(2, %s-1)+1) = %s
            """, i, GRAD_RECITES, 2**i)
            time.sleep(1)
        self.write(', %s word(s) updated for review' % n)

        min_recites = self.db.get('select min(recites) as r from words where recites >= %s'% (GRAD_RECITES+1))['r']
        if min_recites and min_recites > GRAD_RECITES+2:
            n = self.db.execute_rowcount('''
                update words set recites=%s where recites > %s
            ''', GRAD_RECITES+2, GRAD_RECITES+2)
            self.write(', %s reseted' % n)



settings = {
  "debug": True,
  "cookie_secret": "0xdeadbeef",
  "static_path": os.path.join(os.path.dirname(__file__), "static"),
}

app = tornado.wsgi.WSGIApplication([
    (r"/", FrontPageHandler),
    (r"/api/(.*)", RpcHandler),
    (r"/img/(.*)", ImgHandler),
    #(r"/audio/(.*)", AudioHandler),
    (r"/login", LoginHandler),
    (r"/logout", LogoutHandler),
    (r"/howto", HowtoHandler),
    (r"/d123c7/(.*)", DirectHandler),
    (r"/cron/(.*)", CronHandler),
    (r"/(kana\.html)", tornado.web.StaticFileHandler, {"path": "templates"}),
], **settings)


if __name__ == '__main__':
    import wsgiref.simple_server
    httpd = wsgiref.simple_server.make_server('', 8080, app)
    httpd.serve_forever()

