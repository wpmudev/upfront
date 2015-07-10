
<?php

class Upfront_Compat_Bbpress_Bbpress extends Upfront_Server {

    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        add_theme_support( 'bbpress' );
        add_action('wp', array($this, 'detect_virtual_page'));
        
        add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9);
        
        add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"), 9);        
    }

    public function detect_virtual_page () {

        if(is_bbpress()) { // if it is a bbPress page
            //add_filter('template_include', array($this, 'resolve_template'), 99);

            add_filter('upfront-views-view_class', array($this, 'override_view'));
            add_filter('upfront-entity_resolver-entity_ids', array($this, 'resolve_entity_ids'));
        }
            
    }

    /*public function resolve_template ($tpl) {
      $wc_path = preg_quote(wp_normalize_path(WC()->plugin_path()), '/');
        $tpl_path = wp_normalize_path($tpl);

        if (!preg_match("/{$wc_path}/", $tpl_path)) return $tpl;
    
        return locate_template('single.php');
    }*/

    public function override_view ($view_class) {
        if ('Upfront_ThisPostView' === $view_class || 'Upfront_PostsView' === $view_class) return 'Upfront_BbPressView';
        return $view_class;
    }

    public function resolve_entity_ids ($cascade) {
        
        $item = false;
        $type = false;
        $spec = get_queried_object_id();

        if ( bbp_is_forum_archive() ) {
            $item = "forum-archive";
            $type = "archive";

        } elseif ( bbp_is_topic_archive() ) {
            $item = "topic-archive";
            $type = "archive";

        /** Topic Tags ************************************************************/

        } elseif ( bbp_is_topic_tag() ) {
            $item = "topic-tag";
            $type = "single";

        } elseif ( bbp_is_topic_tag_edit() ) {
            $item = "topic-tag-edit";
            $type = "single";

        /** Components ************************************************************/

        } elseif ( bbp_is_single_forum() ) {
            $item = "single-forum";
            $type = "single";

        } elseif ( bbp_is_single_topic() ) {
            $item = "single-topic";
            $type = "single";

        } elseif ( bbp_is_single_reply() ) {
            $item = "single-reply";
            $type = "single";

        } elseif ( bbp_is_topic_edit() ) {
            $item = "topic-edit";
            $type = "single";

        } elseif ( bbp_is_topic_merge() ) {
            $item = "topic-merge";
            $type = "single";

        } elseif ( bbp_is_topic_split() ) {
            $item = "topic-split";
            $type = "single";

        } elseif ( bbp_is_reply_edit() ) {
            $item = "reply-edit";
            $type = "single";

        } elseif ( bbp_is_reply_move() ) {
            $item = "reply-move";
            $type = "single";

        } elseif ( bbp_is_single_view() ) {
            $item = "single-view";
            $type = "single";

        /** User ******************************************************************/

        } elseif ( bbp_is_single_user_edit() ) {
            $item = "user-edit";
            $type = "single";

        } elseif ( bbp_is_single_user() ) {
            $item = "single-user";
            $type = "single";

        } elseif ( bbp_is_user_home() ) {
            $item = "user-home";
            $type = "single";

        } elseif ( bbp_is_user_home_edit() ) {
            $item = "user-home-edit";
            $type = "single";

        } elseif ( bbp_is_topics_created() ) {
            $item = "topics-created";
            $type = "single";

        } elseif ( bbp_is_favorites() ) {
            $item = "favorites";
            $type = "single";

        } elseif ( bbp_is_subscriptions() ) {
            $item = "subscriptions";
            $type = "single";

        /** Search ****************************************************************/

        } elseif ( bbp_is_search() ) {
            $item = "search";
            $type = "single";

        } elseif ( bbp_is_search_results() ) {
            $item = "search-results";
            $type = "archive";
        }
        if (!empty($item)) {
            $cascade['item'] = "bbpress-{$item}"; 
            $cascade['type'] = $type;
            if (!empty($spec)) {
                $cascade['specificity'] = "bbpress-{$item}-{$spec}";
            }
            
        }
        return $cascade;

    }
    public function load_markup () {



        $data = stripslashes_deep($_POST);
         
        ob_start();

        var_dump($data['layout']);

        file_put_contents("debugg.txt", ob_get_clean());
    
        if (empty($data['layout']['item']) && empty($data['layout']['specificity'])) return false; // Don't deal with this if we don't know what it is



        $has_forum_item = !empty($data['layout']['item']) && (bool)strpos($data['layout']['item'], 'forum');
        $has_forum_spec = !empty($data['layout']['specificity']) && (bool)strpos($data['layout']['specificity'], 'forum');



        if (!$has_forum_item && !$has_forum_spec) return false;

        
          
        $this->_out(new Upfront_JsonResponse_Success(array(
                "filtered" => '<div class="upfront-bbpress_compat upfront-plugin_compat"><p>BBPress specific content</p></div>'
            )));
       

    }
    public function load_posts () {
        
       $data = stripslashes_deep($_POST);
       
       ob_start();

        var_dump($data['layout']);

        file_put_contents("debugg.txt", ob_get_clean());

        if (empty($data['layout']['item']) && empty($data['layout']['specificity'])) return false; // Don't deal with this if we don't know what it is



        $has_forum_item = !empty($data['layout']['item']) && (bool)strpos($data['layout']['item'], 'forum');
        $has_forum_spec = !empty($data['layout']['specificity']) && (bool)strpos($data['layout']['specificity'], 'forum');



        if (!$has_forum_item && !$has_forum_spec) return false;

        
        
        $this->_out(new Upfront_JsonResponse_Success(array(
            'posts' => '<div class="upfront-bbpress_compat upfront-plugin_compat"><p>BBPress specific content</p></div>',
            'pagination' => '',
        )));
    }

}

class Upfront_BbPressView extends Upfront_Object {

    public function get_markup () {
        rewind_posts();
        return get_the_content();

    }
}

Upfront_Compat_Bbpress_Bbpress::serve();