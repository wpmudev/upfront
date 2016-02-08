<?php

class Upfront_UFC {

	/**
	 * @var array Theme colors
	 */
	private static $_theme_colors;

	/**
	 * @var string color in hex/rgb/rgba
	 */
	private static $_color;

	/**
	 * @var string ufc
	 */
	private static $_ufc;


	private static $_theme_color_count;
	/**
	 * @param null $color ufc|color
	 *
	 * @return Upfront_UFC
	 */
	public static function init($color = null){
		self::$_theme_colors = get_option('upfront_' . get_stylesheet() . '_theme_colors');
		self::$_theme_colors = apply_filters(
			'upfront_get_theme_colors',
			self::$_theme_colors,
			array(
				'json' => true
			)
		);

		self::$_theme_colors = is_string(self::$_theme_colors) ? json_decode( self::$_theme_colors ) : self::$_theme_colors;
		self::$_theme_color_count = !empty(self::$_theme_colors->colors) ? count( self::$_theme_colors->colors ) : 0;

		if( strpos( $color, "ufc" ) !== false ){
			self::$_ufc = $color;
		}else{
			self::$_color = $color;
		}



		return new self;
	}

	/**
	 * Return ufc from given color
	 *
	 * @param $color
	 *
	 * @return null|string
	 */
	public function get_ufc( $color = null){
		$color = empty( $color ) ? self::$_ufc : $color;

		if( strpos($color, "ufc")  !== false ) return $color;

		$color = $this->_hex2rgb( $color );

		$theme_colors = self::$_theme_colors->colors;

		foreach( $theme_colors as $key => $theme_color ){
			if( $color === $this->_hex2rgb(  $theme_color->color ) ) return "ufc" . $key;
		}
		return false;
	}


	/**
	 * Returns color string from ufc
	 *
	 * @param $ufc
	 *
	 * @return bool|string color
	 */
	public function get_color( $ufc = null){
		$ufc = empty( $ufc ) ? self::$_ufc : $ufc;

		$index = (int)  str_replace("ufc", "", $ufc);

		$theme_colors = self::$_theme_colors->colors;

		foreach($theme_colors as $key => $theme_color){
			if( $key === $index ) return $theme_color->color;
		}

		return false;
	}

	/**
	 * Checks if given color is hex
	 *
	 * @param $color
	 *
	 * @return bool
	 */
	private function _is_hex( $color ){
		return ctype_xdigit( $color );
	}

	/**
	 * Checks if given color is rgb
	 *
	 * @param $color
	 *
	 * @return bool
	 */
	private function _is_rgb( $color ){
		if( $this->_is_hex( $color ) ) return false;

		$color = preg_replace('/\s+/', '', $color);
		$color = explode(",", $color);
		return count($color) === 3;

	}

	/**
	 * Checks if given color is rgba
	 *
	 * @param $color
	 *
	 * @return bool
	 */
	private function _is_rgba( $color ){
		return !$this->_is_rgb( $color );
	}

	private function _hex2rgb( $color ) {
		if( !$this->_is_hex( $color ) ) return $color;

		if ( $color[0] == '#' ) {
			$color = substr( $color, 1 );
		}

		if ( strlen( $color ) == 6 ) {
			list( $r, $g, $b ) = array( $color[0] . $color[1], $color[2] . $color[3], $color[4] . $color[5] );
		} elseif ( strlen( $color ) == 3 ) {
			list( $r, $g, $b ) = array( $color[0] . $color[0], $color[1] . $color[1], $color[2] . $color[2] );
		} else {
			return false;
		}

		$r = hexdec( $r );
		$g = hexdec( $g );
		$b = hexdec( $b );

		return "(" . $r . "," . $g . "," . $b . ")";
	}

	public function process_colors( $string ){

		$theme_colors = !empty(self::$_theme_colors->colors) ? self::$_theme_colors->colors : array();
		
		for( $i = 0; $i < self::$_theme_color_count ; $i++ ){
			
			// This just ensures that the css integrity is not compromised if any colors are stored as commented out ufc with color code already.
			// helps with unclean css saved from previous versions of the code */
			$pattern = '/\/\*#ufc'.$i.'\*\/([^\s;]*)/i';
			$string = preg_replace($pattern, $theme_colors[$i]->color." ", $string);

			$string = str_replace("#ufc" . $i, $theme_colors[$i]->color  , $string );
		}
		

		return $string;
	}

}

