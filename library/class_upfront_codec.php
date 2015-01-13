<?php

/**
 * Standardized macro expansion hub.
 */
abstract class Upfront_MacroCodec {
	const OPEN = '{{';
	const CLOSE = '}}';

	protected static $_open;
	protected static $_close;

	/**
	 * Returns opening macro delimiter, unescaped.
	 * @return string Opening macro delimiter
	 */
	public static function open () {
		return !empty(self::$_open)
			? self::$_open
			: self::OPEN
		;
	}

	/**
	 * Returns closing macro delimiter, unescaped.
	 * @return string Closing macro delimiter
	 */
	public static function close () {
		return !empty(self::$_close)
			? self::$_close
			: self::CLOSE
		;
	}

	/**
	 * Returns compiled, preg_escape'd macro regex
	 * @param  string $part String part of the macro (macro name)
	 * @return string Final macro regex
	 */
	public static function get_regex ($part) {
		return '/' . preg_quote(self::open() . $part . self::close(), '/') . '/';
	}

	/**
	 * Extract all the macro tags from a string
	 * @param  string $content String to check
	 * @return array Collected macro tags
	 */
	public static function get_tags ($content) {
		$tags = $matches = array();
		if (empty($content)) return $tags;

		preg_match_all('/' . preg_quote(self::open(), '/') . '(.*)' . preg_quote(self::close(), '/') . '/', $content, $matches);
		if (!empty($matches[1])) $tags = $matches[1];

		return $tags;
	}

	/**
	 * Generic single macro expansion method
	 * @param  string $content Content to act on
	 * @param  string $tag Raw macro tag (name) to work with
	 * @param  string $value Value to replace macro with
	 * @return string Compiled content
	 */
	public static function expand ($content, $tag, $value) {
		if (empty($content)) return $content;
		if (empty($tag)) return $content;

		$macro = self::get_regex($tag);
		return preg_replace($macro, $value, $content);
	}
}

/**
 * Postmeta codec implementation.
 */
class Upfront_MacroCodec_Postmeta extends Upfront_MacroCodec {

	/**
	 * Expand known postmeta macros in the content
	 *
	 * Very literal, it will treat all the macros as postmeta macros.
	 *
	 * @param  string $content Content to expand macros in
	 * @param  mixed $post Post to fetch metas for
	 * @return string Expanded content
	 */
	public static function expand_all ($content, $post) {
		if (empty($content)) return $content;
		if (empty($post)) return $content;

		$tags = self::get_tags($content);
		if (empty($tags)) return $content;

		$post_id = false;
		if (!is_object($post) && is_numeric($post)) {
			$post_id = $post;
			$post = get_post($post_id);
		} else {
			$post_id = !empty($post->ID) ? $post->ID : false;
		}

		$metadata = Upfront_PostmetaModel::get_post_meta_fields($post_id, $tags);

		foreach ($metadata as $item) {
			if (empty($item['meta_key'])) continue;

			$key = $item['meta_key'];
			$value = isset($item['meta_value']) ? $item['meta_value'] : '';

			$value = apply_filters('upfront-postmeta-value',
				apply_filters("upfront-postmeta-{$key}-value", $value, $post_id),
				$value, $post_id, $key
			);

			$content = preg_replace(self::get_regex($key), $value, $content);
		}

		// Re-iterate through tags and null out empty replacement macros.
		foreach ($tags as $tag) {
			$content = preg_replace(self::get_regex($tag), '', $content);
		}

		return $content;
	}
}
