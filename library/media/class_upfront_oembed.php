<?php

class Upfront_Oembed {

	private $_wp_oembed;
	private $_url;

	public function __construct ($url=false) {
		if (!function_exists('_wp_oembed_get_object')) require_once ABSPATH . WPINC . '/class-oembed.php';
		$this->_wp_oembed = _wp_oembed_get_object();
		$this->set_url($url);
	}

	public function set_url ($url) {
		$this->_url = esc_url($url);
	}

	public function get_info () {
		if (!$this->_url) return false;
		$provider = false;

		// Yay! Tight coupled code, so let's nab
		foreach ( $this->_wp_oembed->providers as $matchmask => $data ) {
			list( $providerurl, $regex ) = $data;

			// Turn the asterisk-type provider URLs into regex
			if ( !$regex ) {
				$matchmask = '#' . str_replace( '___wildcard___', '(.+)', preg_quote( str_replace( '*', '___wildcard___', $matchmask ), '#' ) ) . '#i';
				$matchmask = preg_replace( '|^#http\\\://|', '#https?\://', $matchmask );
			}

			if ( preg_match( $matchmask, $this->_url ) ) {
				$provider = str_replace( '{format}', 'json', $providerurl ); // JSON is easier to deal with than XML
				break;
			}
		}
		// Done nabbing

		if (!$provider) $provider = $this->_wp_oembed->discover($this->_url);
		if (!$provider) return false;
		return $this->_wp_oembed->fetch($provider, $this->_url, array('discover' => true, 'width' => 10000, 'height' => 10000));
	}

	public function get_embed_code () {
		$info = $this->get_info();
		if (empty($info) || !is_object($info) || empty($info->html)) return false;
		return $info->html;
	}
}