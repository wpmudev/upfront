<?php

require_once "class_upfront_ufc_utils.php";

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
	 * @var class instance of Upfront_UFC_Utils
	 */
	private static $_utils;

	/**
	 * @static string ufc, used to build the ufc variable
	 */
	const VAR_PREFIX = "ufc";

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

		if( strpos( $color, self::VAR_PREFIX ) !== false ){
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

		if( strpos($color, self::VAR_PREFIX)  !== false ) return $color;

		$color = self::utils()->hex2rgb( $color );

		$theme_colors = self::$_theme_colors->colors;

		foreach( $theme_colors as $key => $theme_color ){
			if( $color === self::utils()->hex2rgb(  $theme_color->color ) ) return self::VAR_PREFIX . $key;
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

		$index = (int)  str_replace(self::VAR_PREFIX, "", $ufc);

		$theme_colors = self::$_theme_colors->colors;

		foreach($theme_colors as $key => $theme_color){
			if( $key === $index ) return $theme_color->color;
		}

		return false;
	}


	/**
	 * Replaces ufc variables with actual color code
	 * First makes sure we don't have commented ufc colors in the given string and instead we only have ufc vars
	 * then converts the variables to actual colors
	 *
	 * @uses Upfront_UFC_Utils::replace_commented_style_with_variable
	 * @uses convert_variables_to_color
	 * @param $string
	 * @return mixed
	 */
	public function process_colors( $string ){
		$string = self::utils()->replace_commented_style_with_variable( $string );
		return $this->convert_variables_to_color( $string );
	}

	/**
	 * Finds and converts ufc variables to actual colors
	 *
	 * @param string $string
	 * @return mixed
	 */
	public function convert_variables_to_color( $string ){
		$theme_colors = !empty(self::$_theme_colors->colors) ? self::$_theme_colors->colors : array();

		for( $i = 0; $i < self::$_theme_color_count ; $i++ ){
			$string = str_replace("#" . self::VAR_PREFIX . $i, $theme_colors[$i]->color  , $string );
		}

		return $string;
	}

	/**
	 * Returns instance of Upfront_UFC_Utils
	 *
	 * @return Upfront_UFC_Utils
	 */
	static function utils(){
		if( self::$_utils instanceof Upfront_UFC_Utils)
			return self::$_utils;

		self::$_utils = new Upfront_UFC_Utils();

		return self::$_utils;
	}

}

