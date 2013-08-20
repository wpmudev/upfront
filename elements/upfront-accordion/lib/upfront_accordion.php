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
}
