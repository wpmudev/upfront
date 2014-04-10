<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UsearchView extends Upfront_Object {
    public function get_markup(){
        $data = $this->properties_to_array();
        $data['action'] = home_url('/');
        $data['iconClass'] = $data['label'] == '__image__' ? 'icon' : 'text';

        return upfront_get_template('usearch', $data, dirname(dirname(__FILE__)) . '/tpl/usearch.html');
    }

    private function properties_to_array(){
        $out = array();
        foreach($this->_data['properties'] as $prop)
            $out[$prop['name']] = $prop['value'];
        return $out;
    }

	public static function add_js_defaults($data){
        $data['usearch'] = array(
            'defaults' => self::default_properties(),
         );
        return $data;
    }

    //Defaults for properties
    public static function default_properties(){
        return array(
            'type' => 'UsearchModel',
            'view_class' => 'UsearchView',
            'class' => 'c24 upfront-search',
            'has_settings' => 1,
            'id_slug' => 'usearch',

            'placeholder' => 'Search',
            'label' => 'Custom text',
            'is_rounded' => 0,
            'color' => ''
        );
    }
}
