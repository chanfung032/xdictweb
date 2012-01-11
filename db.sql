-- phpMyAdmin SQL Dump
-- version 3.3.8.1
-- http://www.phpmyadmin.net
--
-- 主机: w.rdc.sae.sina.com.cn:3307
-- 生成日期: 2011 年 12 月 31 日 20:22
-- 服务器版本: 5.1.47
-- PHP 版本: 5.2.9

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- 数据库: `app_xdictweb`
--

-- --------------------------------------------------------

--
-- 表的结构 `xd_users`
--

CREATE TABLE IF NOT EXISTS `xd_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weibo_uid` bigint(20) NOT NULL,
  `accesskey` char(40) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

-- --------------------------------------------------------

--
-- 表的结构 `xd_wordlist`
--

CREATE TABLE IF NOT EXISTS `xd_wordlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weibo_uid` bigint(20) NOT NULL,
  `word` varchar(32) NOT NULL,
  `phonetic` varchar(32) NOT NULL DEFAULT '',
  `meaning` varchar(256) NOT NULL,
  `hits` int(11) NOT NULL,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `weibo_uid` (`weibo_uid`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=412 ;
