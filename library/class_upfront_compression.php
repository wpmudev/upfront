<?php

/**
 * Handle data compression and extraction, uses Gzip
 *
 * @author Jeffri Tjin
 */

class Upfront_Compression {

	/* Method of compression, currently supported: zlib */
	static protected $method = "zlib";
	/* Level of compression, usually ranged from 1-9 */
	static protected $level = 1;

	static public function init () {
		if ( defined("UPFRONT_SAVE_COMPRESSION_METHOD") ) self::$method = UPFRONT_SAVE_COMPRESSION_METHOD;
		if ( defined("UPFRONT_SAVE_COMPRESSION_LEVEL") ) self::$level = UPFRONT_SAVE_COMPRESSION_LEVEL;
	}

	/**
	 * Check if compression is enabled, can be disabled by constant or option
	 * Will be automatically disabled if extension isn't supported
	 *
	 * @return bool
	 */
	static public function is_enabled () {
		if ( defined("UPFRONT_DISABLE_SAVE_COMPRESSION") && UPFRONT_DISABLE_SAVE_COMPRESSION ) return false;
		$disable_compression = Upfront_Cache_Utils::get_option('upfront_disable_save_compression');
		if ( !empty($disable_compression) ) return false;
		if ( "zlib" === self::$method ) return extension_loaded('zlib');
		return false;
	}

	/**
	 * Return the compression level
	 *
	 * @return int Compression level
	 */
	static public function get_level () {
		return self::$level;
	}

	/**
	 * Extract base64 encoded string of compressed data to the original data
	 *
	 * @param string $encoded_string base64 encoded string of compressed data
	 * @param int $compressed_length verify compressed length before processing, pass 0 for no verification
	 * @param int $original_length verify original length after processing, pass 0 for no verification
	 * @param bool $assoc return associative array or not
	 *
	 * @return mixed original data
	 */
	static public function extract ($encoded_string, $compressed_length = 0, $original_length = 0, $assoc = true) {
		if ( !self::is_enabled() ) return false;
		if ( "zlib" === self::$method ) {
			return self::_gz_extract($encoded_string, $compressed_length, $original_length, $assoc);
		}
		return false;
	}

	/**
	 * Uses gzinflate for extract
	 *
	 * @param string $encoded_string base64 encoded string of compressed data
	 * @param int $compressed_length verify compressed length before processing, pass 0 for no verification
	 * @param int $original_length verify original length after processing, pass 0 for no verification
	 *
	 * @return mixed original data
	 */
	static protected function _gz_extract ($encoded_string, $compressed_length = 0, $original_length = 0, $assoc = true) {
		if ( $compressed_length > 0 && $compressed_length !== self::_strlen($encoded_string) ) return false;
		$extracted = gzinflate( base64_decode($encoded_string) );
		if ( $original_length > 0 && $original_length !== self::_strlen($extracted) ) return false;
		return json_decode($extracted, $assoc);
	}

	/**
	 * Compress data and return base64 encoded string
	 *
	 * @param mixed $data
	 * @param int $level
	 *
	 * @return array array consisting of compressed base64 encoded string, original length and compressed length
	 */
	static public function compress ($data, $level = false) {
		if ( !self::is_enabled() ) return false;
		if ( !is_numeric($level) || $level < 1 ) $level = self::$level;
		if ( "zlib" === self::$method ) {
			return self::_gz_compress($data, $level);
		}
		return false;
	}

	/**
	 * Uses gzdeflate for compression
	 *
	 * @param mixed $data
	 * @param int $level
	 *
	 * @return array array consisting of compressed base64 encoded string, original length and compressed length
	 */
	static protected function _gz_compress ($data, $level) {
		$json_string = json_encode($data);
		$compressed = gzdeflate($json_string, $level);
		$encoded = base64_encode($compressed);
		return array(
			'result' => $encoded,
			'original_length' => strlen($json_string),
			'compressed_length' => strlen($encoded)
		);
	}

	/**
	 * Automatically extract data from $_POST['data'] or from passed param
	 *
	 * @param array $data
	 * @param string $fields
	 * @param bool $assoc
	 * @return mixed extracted data
	 */
	static public function extract_from_request ($data = null, $fields = null, $assoc = true) {
		if ( !self::is_enabled() ) return false;
		$data = null === $data ? $_POST : $data;
		$use_compression = ( !empty($data['compression']) && 1 === intval($data['compression']) );

		if ( !$use_compression ) return false;

		if ( null === $fields ) {
			$fields = array(
				'data' => "data",
				'original_length' => "original_length",
				'compressed_length' => "compressed_length"
			);
		}

		$original_length = !empty($data[$fields['original_length']]) ? intval($data[$fields['original_length']]) : 0;
		$compressed_length = !empty($data[$fields['compressed_length']]) ? intval($data[$fields['compressed_length']]) : 0;
		$extracted = !empty($data[$fields['data']]) ? self::extract($data[$fields['data']], $compressed_length, $original_length, $assoc) : false;

		return $extracted;
	}

	/**
	 * Safe method of getting string length properly
	 *
	 * @param $string
	 */
	static protected function _strlen ($string) {
		if ( function_exists("mb_strlen") ) return mb_strlen($string);
		return strlen( utf8_decode($string) );
	}

}

Upfront_Compression::init();


