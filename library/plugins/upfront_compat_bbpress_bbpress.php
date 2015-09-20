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

        //upfront_add_ajax('wp_ajax_content_part_markup', array($this, "get_part_contents"), 9); // to override loading of post parts in case the editor initializes on this_post.      

        // exporter, BBPress specific layouts
        add_filter('upfront-core-default_layouts', array($this, 'augment_default_layouts'));
    }

    public function detect_virtual_page () {

        if(is_bbpress()) { // if it is a bbPress page
            //add_filter('template_include', array($this, 'resolve_template'), 99);
            add_filter('upfront-views-view_class', array($this, 'override_view'));
            add_filter('upfront-entity_resolver-entity_ids', array($this, 'resolve_entity_ids'));
        }
            
    }

    /**
     * Augments the available layouts list by adding some BBPress-specific ones.
     *
     * @param array $layouts Predefined Upfront layouts
     *
     * @return array Augmented layouts list
     */
    public function augment_default_layouts ($layouts) {
       
        $layouts["bbpress-single-forum"] = array(
            'label' => "BBPress Single Forum",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-single-forum",
                'specificity' => "bbpress-single-forum",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-single-topic"] = array(
            'label' => "BBPress Single Topic",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-single-topic",
                'specificity' => "bbpress-single-topic",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-topic-split"] = array(
            'label' => "BBPress Topic Split",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-topic-split",
                'specificity' => "bbpress-topic-split",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-reply-edit"] = array(
            'label' => "BBPress Reply Edit",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-reply-edit",
                'specificity' => "bbpress-reply-edit",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-reply-move"] = array(
            'label' => "BBPress Reply Move",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-reply-move",
                'specificity' => "bbpress-reply-move",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-topic-tag"] = array(
            'label' => "BBPress Topic Tag",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-topic-tag",
                'specificity' => "bbpress-topic-tag",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-topic-tag-edit"] = array(
            'label' => "BBPress Topic Tag Edit",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-topic-tag-edit",
                'specificity' => "bbpress-topic-tag-edit",
                'plugin' => 'plugin'
            )
        );

        
        $layouts["bbpress-user-home"] = array(
            'label' => "BBPress User Home",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-user-home",
                'specificity' => "bbpress-user-home",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-topics-created"] = array(
            'label' => "BBPress User Topics",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-topics-created",
                'specificity' => "bbpress-topics-created",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-replies-created"] = array(
            'label' => "BBPress User Replies",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-replies-created",
                'specificity' => "bbpress-replies-created",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-user-home"] = array(
            'label' => "BBPress User Favorites",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-favorites",
                'specificity' => "bbpress-favorites",
                'plugin' => 'plugin'
            )
        );

        $layouts["bbpress-user-subscriptions"] = array(
            'label' => "BBPress User Subscriptions",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-subscriptions",
                'specificity' => "bbpress-subscriptions",
                'plugin' => 'plugin'
            )
        );


        $layouts["bbpress-user-edit"] = array(
            'label' => "BBPress User Edit",
            'layout' => array(
                'type' => 'single',
                'item' => "bbpress-user-home-edit",
                'specificity' => "bbpress-user-home-edit",
                'plugin' => 'plugin'
            )
        );


        $layouts["bbpress-forum-archive"] = array(
            'label' => "BBPress Forums Archive",
            'layout' => array(
                'type' => 'archive',
                'item' => "bbpress-forum-archive",
                'plugin' => 'plugin'
            )
        );
        $layouts["bbpress-topic-archive"] = array(
            'label' => "BBPress Topics Archive",
            'layout' => array(
                'type' => 'archive',
                'item' => "bbpress-topic-archive",
                'plugin' => 'plugin'
            )
        );
       
        return $layouts;
    }

    public function override_view ($view_class) {
        if ('Upfront_ThisPostView' === $view_class || 'Upfront_PostsView' === $view_class) return 'Upfront_BbPressView';
        return $view_class;
    }

    public function resolve_entity_ids ($cascade) {
        
        $item = false;
        $type = false;
        $spec = get_queried_object_id();

        if ( bbp_is_forum_archive() ) { //works fine in editor mode
            $item = "forum-archive";
            $type = "archive";

        } 

        if ( bbp_is_topic_archive() ) { //works fine in editor mode
            $item = "topic-archive";
            $type = "archive";

        /** Topic Tags ************************************************************/

        } 

        if ( bbp_is_topic_tag() ) {
            $item = "topic-tag";
            $type = "single";

        } 

        if ( bbp_is_topic_tag_edit() ) {
            $item = "topic-tag-edit";
            $type = "single";

        /** Components ************************************************************/

        } 

        if ( bbp_is_single_forum() ) { //works fine in editor mode
            $item = "single-forum";
            $type = "single";

        } 

        if ( bbp_is_single_topic() ) { //not persistent
            $item = "single-topic";
            $type = "single";

        } 

        if ( bbp_is_single_reply() ) {
            $item = "single-reply";
            $type = "single";

        } 

        if ( bbp_is_topic_edit() ) {
            $item = "topic-edit";
            $type = "single";

        } 

        if ( bbp_is_topic_merge() ) {
            $item = "topic-merge";
            $type = "single";

        } 

        if ( bbp_is_topic_split() ) {
            $item = "topic-split";
            $type = "single";

        } 

        if ( bbp_is_reply_edit() ) {
            $item = "reply-edit";
            $type = "single";

        } 

        if ( bbp_is_reply_move() ) {
            $item = "reply-move";
            $type = "single";

        } 

        if ( bbp_is_single_view() ) {
            $item = "single-view";
            $type = "single";

        /** User ******************************************************************/

        } 

        /*if ( bbp_is_single_user_edit() ) {
            $item = "user-edit";
            $type = "single";

        } */

        if (bbp_is_single_user() ) {
               
                $item = "single-user";
                $type = "single";

            if ( bbp_is_topics_created() ) {
                $item = "topics-created";
                $type = "single";

            } 
            elseif( bbp_is_replies_created() ) {
                $item = "replies-created";
                $type = "single";
            }
            elseif ( bbp_is_favorites() ) {
                $item = "favorites";
                $type = "single";

            } 

            elseif ( bbp_is_subscriptions() ) {
                $item = "subscriptions";
                $type = "single";

            } 
            elseif ( bbp_is_user_home_edit() ) {
                $item = "user-home-edit";
                $type = "single";

            } 
            elseif ( bbp_is_user_home() ) {
                $item = "user-home";
                $type = "single";

            } 
        }

        if ( bbp_is_search() ) {
            $item = "search";
            $type = "single";

        } 

        if ( bbp_is_search_results() ) {
            $item = "search-results";
            $type = "archive";
        }

        if (!empty($item)) {
            $cascade['item'] = "bbpress-{$item}"; 
            $cascade['type'] = $type;
            //if (!empty($spec)) {
                $cascade['specificity'] = "bbpress-{$item}".((!empty($spec))?"-{$spec}":"");
                $cascade['plugin'] = 'plugin';
            //}
            
        }

        return $cascade;

    }
    public function load_markup () {

        $data = stripslashes_deep($_POST);
        
      
        if (empty($data['layout']['item']) && empty($data['layout']['specificity'])) return false; // Don't deal with this if we don't know what it is



        $has_forum_item = !empty($data['layout']['item']) && !(strpos($data['layout']['item'], 'bbpress') === false);
        $has_forum_spec = !empty($data['layout']['specificity']) && !(strpos($data['layout']['specificity'], 'bbpress') === false);


        if (!$has_forum_item && !$has_forum_spec) return false;

        $this->_out(new Upfront_JsonResponse_Success(array(
                "filtered" => '<div class="upfront-bbpress_compat upfront-plugin_compat"><p>BBPress specific content</p></div>'
            )));
       

    }

    public function load_posts () {
        
        $data = stripslashes_deep($_POST);

        if (empty($data['layout']['item'])) return false; // Don't deal with this if we don't know what it is



        $has_forum_item = !(strpos($data['layout']['item'], 'bbpress') === false);
        //$has_forum_spec = !empty($data['layout']['specificity']) && (bool)strpos($data['layout']['specificity'], 'bbpress');



        if (!$has_forum_item )//&& !$has_forum_spec) return false;
            return false;
  
        
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