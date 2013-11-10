<?php

class Upfront_AccordionView extends Upfront_Object {

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';
        return "<div class='upfront-output-object upfront-accordion' {$element_id}>" . $this->_get_property('content') . '</div><script type="text/javascript">jQuery(document).ready(function($) { $( ".accordion" ).accordion({
                        heightStyle: "content"
                    }); });</script>';
    }


    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_script(array('jquery-ui-accordion'));
        wp_enqueue_style('upfront-accordion', upfront_element_url('css/upfront_accordion.css', dirname(__FILE__)));
    }

    public static function add_js_defaults($data){
        $data['uaccordion'] = array(
            'defaults' => self::default_properties(),
         );
        return $data;
    }

    public static function default_properties(){
        return array(
            'type' => "AccordionModel",
            'view_class' => "AccordionView",
            "class" => "c22 upfront-accordion_element-object",
            'has_settings' => 0,
            'id_slug' => 'upfront-accordion',

            'content' => '<div class="accordion">
                            <h3>Section title</h3><div><p>My awesome stub content goes here</p></div>
                            <h3>Second section</h3><div><p>My awesome stub content goes here</p></div>                            
                        </div>'
        );
    }
}
