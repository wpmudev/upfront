
<?php

class Upfront_Compat_Bbpress_Bbpress implements IUpfront_Server {

    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        add_theme_support( 'bbpress' );
        add_action('wp', array($this, 'detect_virtual_page'));
        add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9);
    }

    public function detect_virtual_page () {

        if(is_bbpress()) { // if it is a bbPress page
            add_filter('upfront-views-view_class', array($this, 'override_view'));
            add_filter('upfront-entity_resolver-entity_ids', array($this, 'resolve_entity_ids'));
        }
            
    }

    public function override_view ($view_class) {
        if ('Upfront_ThisPostView' === $view_class || 'Upfront_PostsView' === $view_class) return 'Upfront_BbPressView';
        return $view_class;
    }

    public function resolve_entity_ids ($cascade) {
        //$cascade['item'] = "wtf wtf";

        return $cascade;

    }

    public function load_posts () {
        
        $data = stripslashes_deep($_POST);


        ob_start();
        echo "new one dad";
        var_dump($data['layout']);
        file_put_contents("debugg.txt", ob_get_clean()); 

       // if (empty($data['layout']['item']) && empty($data['layout']['specificity'])) return false; // Don't deal with this if we don't know what it is

       /* $has_woo_item = !empty($data['layout']['item']) && (bool)preg_match('/^woocommerce/', $data['layout']['item']);
        $has_woo_spec = !empty($data['layout']['specificity']) && (bool)preg_match('/^woocommerce/', $data['layout']['specificity']);

        if (!$has_woo_item && !$has_woo_spec) return false;
*/
       /* echo " hi wassup";
        $this->_out(new Upfront_JsonResponse_Success(array(
            'posts' => '<div class="upfront-woocommerce_compat upfront-plugin_compat"><p>WooCommerce specific content</p></div>',
            'pagination' => '',
        )));
        */
    }

}

class Upfront_BbPressView extends Upfront_Object {

    public function get_markup () {
        rewind_posts();
        return get_the_content();

    }
}

Upfront_Compat_Bbpress_Bbpress::serve();