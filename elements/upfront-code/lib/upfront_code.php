<?php

class Upfront_CodeView extends Upfront_Object {

	public function get_markup () {
        $_id = $this->_get_property('element_id');
        $element_id = $_id ? "id='{$_id}'" : '';
        $properties = array();
        foreach ($this->_data['properties'] as $prop) {
            $properties[$prop['name']] = $prop['value'];
        }
        //$properties = wp_parse_args($properties, self::default_properties());

        if (empty($properties)) return ''; // No info for this element, carry on.

        // Alright! Let's see if we have any CSS here and scope it if we do
        $style = !empty($properties['style'])
            ? $this->_to_scoped_style($properties['style'], $_id)
            : ''
        ;
        $script = !empty($properties['script'])
            ? $this->_to_scoped_script($properties['script'])
            : ''
        ;
        return "<div class='upfront_code-public' {$element_id}>" . $properties['markup'] . $style . $script . "</div>";
	}

    private function _to_scoped_style ($raw, $id) {
        $id = !empty($id) ? "#{$id}" : '';
        $scoped = '';
        $raw = explode('}', $raw);
        if (empty($raw)) return $scoped;
        foreach ($raw as $rule) {
            $scoped .= "{$id} {$rule} }";
        }
        return !empty($scoped)
            ? "<style>{$scoped}</style>"
            : ''
        ;
    }

    private function _to_scoped_script ($raw) {
        return !empty($raw)
            ? "<script>;(function ($) { {$raw}\n })(jQuery);</script>"
            : ''
        ;
    }

    public static function default_properties () {
        return array(
            'type' => "CodeModel",
            'view_class' => "CodeView",
            "class" => "c22 upfront-code_element-object",
            'has_settings' => 0,
            'id_slug' => 'upfront-code_element',

            'fallbacks' => array(
                'markup' => '<b>Enter your markup here...</b>',
                'style' => '/* Your styles here */',
                'script' => '/* Your code here */',
            )
        );
    }

    public static function add_js_defaults ($data) {
        $data['upfront_code'] = array(
            'defaults' => self::default_properties(),
         );
        return $data;
    }

}
add_filter('upfront_data', array('Upfront_CodeView', 'add_js_defaults'));