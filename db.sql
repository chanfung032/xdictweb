-- phpMyAdmin SQL Dump
-- version 3.3.8.1
-- http://www.phpmyadmin.net
--
-- 主机: w.rdc.sae.sina.com.cn:3307
-- 生成日期: 2013 年 01 月 16 日 16:40
-- 服务器版本: 5.5.23
-- PHP 版本: 5.2.9

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 数据库: `app_xdictweb`
--

-- --------------------------------------------------------

--
-- 表的结构 `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weibo_uid` bigint(20) NOT NULL,
  `accesskey` char(40) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=8 ;

-- --------------------------------------------------------

--
-- 表的结构 `wordlist`
--

CREATE TABLE IF NOT EXISTS `wordlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weibo_uid` bigint(20) NOT NULL,
  `word` varchar(32) NOT NULL,
  `phonetic` varchar(32) NOT NULL DEFAULT '',
  `meaning` varchar(256) NOT NULL,
  `hits` int(11) NOT NULL COMMENT '查询次数',
  `recites` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '记诵次数',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `weibo_uid` (`weibo_uid`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=588 ;
