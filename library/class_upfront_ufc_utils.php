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
     * Replaces commented form of ufc styles with simple ufc variable
     *
     * @param string $style
     * @return string
     */
    public function replace_commented_style_with_variable($style)
    {
        $pattern = '/\/\*[^,;\n]*#'.preg_quote(Upfront_UFC::VAR_PREFIX, '/').'(\d*)\*\/[^,;\n]*([\*\/]*((#[A-Fa-f0-9]+)+|(rgb[a]?[^\)]*\))))+/i';
        return preg_replace($pattern, '#'.Upfront_UFC::VAR_PREFIX.'$1', $style);
    }
}