<?php

function upfront_facepile_initialize(){

    // Include the backend support stuff
    require_once(dirname(__FILE__) . '/lib/upfront-facepile.php');

    // Expose our JavaScript definitions to the Upfront API
    upfront_add_layout_editor_entity('upfront-facepile', upfront_element_url('js/upfront-facepile', __FILE__));

    // Add the public stylesheet
    add_action('wp_enqueue_scripts', array('Upfront_FacepileView', 'add_public_style'));
}
//Hook it when Upfront is ready
add_action('upfront-core-initialized', 'upfront_facepile_initialize');