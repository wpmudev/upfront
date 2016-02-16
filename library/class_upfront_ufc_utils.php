<?php


class Upfront_UFC_Utils
{

	/**
	 * Checks if given color is hex
	 *
	 * @param $color
	 *
	 * @return bool
	 */
	public function is_hex( $color ){
		return ctype_xdigit( $color );
	}

	/**
	 * Checks if given color is rgb
	 *
	 * @param $color
	 *
	 * @return bool
	 */
	public function is_rgb( $color ){
		if( $this->is_hex( $color ) ) return false;

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
	public function is_rgba( $color ){
		return !$this->is_rgb( $color );
	}

	/**
	 * Converts hex color to rgb
	 *
	 * @param $color
	 * @return bool|string
	 */
	public function hex2rgb( $color ) {
		if( !$this->is_hex( $color ) ) return $color;

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

	/**
	 * Removes unused whitespace from style string
	 * @param  string $css_string
	 * @return string|Null
	 */
	function remove_unused_space( $css_string ) {
		if(trim($css_string) === "") return $css_string;
		return preg_replace(
			'#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/))|\s*+;\s*+(})\s*+|\s*+([*$~^|]?+=|[{};,>~+]|\s*+-(?![0-9\.])|!important\b)\s*+|([[(:])\s++|\s++([])])|\s++(:)\s*+(?!(?>[^{}"\']++|"(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')*+{)|^\s++|\s++\z|(\s)\s+#si',
			'$1$2$3$4$5$6$7',
			$css_string
		);
	}

	/**
	 * Callback to clean spaces inside matches found by preg_replace_callback in self::remove_whitespace_from_rgb_values
	 *
	 * @param $matches
	 * @return mixed
	 */
	private function _clean_spaces($matches) {
		return str_replace(' ', '', $matches[0]);
	}

	/**
	 * Removes white space from rgba and rgb values
	 * i.e. rgba(1, 5, 10, 20) => rgba(1,5,10,20)
	 *
	 * @uses clean_spaces
	 * @param $css_string
	 * @return mixed
	 */
	function remove_whitespace_from_rgb_values($css_string){

		return preg_replace_callback('/rgb([^\)]*)\)/i', array($this, '_clean_spaces'), $css_string);

		return str_replace(", ", ",", $css_string);
	}

	/**
	 * Replaces commented form of ufc styles with simple ufc variable
	 *
	 * @param string $style
	 * @return string
	 */
	public function replace_commented_style_with_variable ($style) {
		// Cache function call results
		$open_comment = preg_quote('/*', '/');
		$close_comment = preg_quote('*/', '/');
		$pfx = preg_quote('#' . Upfront_UFC::VAR_PREFIX, '/');

		$pattern = '/' .
			$open_comment . // Open block comment
			'\s*' . // Any number of optional whitespaces here
				'(' . $pfx . '\d+)' . // Don't hardcode color variable - also, ensure the format is proper: prefix + one or more digits
			'\s*' . // Any number of optional whitespaces here
			$close_comment . // Close block comment
			'\s*' . // Any number of optional whitespaces here
			// We also need to match the actual expanded color following the quoted expression
			// This can be either a HEX color string, or a RGB(A) color string
			'(' . // Stuff all of the color part in $2 to group optional format matches
				'#[a-fA-F0-9]{3,6}' . // hex expression
				'|' . // ... or ...
				// RGB(A) color expression:
				'rgba?' . // 1) rgb or rgba
					'\s*' . // 2) followed by an optional whitespace
					'\(' . // 3) followed by an opening bracket
						'[^\)]+?' . // 4) then any number of characters that are not closing bracket - NOTE the non-greedy operator
					'\)' .  // 5) then finally a closing bracket
				'' . // Done with RGB(A) matching
			')' . // Done grouping
		'/';
		$style = preg_replace($pattern, '$1 ', $style);
		return preg_match('/' . $open_comment . '\s*' . $pfx . '/', $style) // Do we still have commented vars? Can happen with nested comments
			? $this->replace_commented_style_with_variable($style) // We do? Clean up again
			: $style // Yay, we're done here
		;
	}

	private function _replace_commented_style_with_variable_replacement( $matches ){
		return trim( $matches[3] ) === "," || trim( $matches[3] ) === ")" ? $matches[2] . $matches[3] : $matches[2];
	}
}