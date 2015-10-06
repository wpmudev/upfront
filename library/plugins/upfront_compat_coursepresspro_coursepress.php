<?php

class Upfront_Compat_Coursepresspro_Coursepress extends Upfront_Server {

    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        //add_theme_support( 'bbpress' );
        
        add_action('wp', array($this, 'detect_virtual_page'));
        
       // add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9);
        
        //add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"), 9);  

        

        // exporter, BBPress specific layouts
        //add_filter('upfront-core-default_layouts', array($this, 'augment_default_layouts'));
    }

    public function detect_virtual_page () {

       
		if ( class_exists( 'CoursePress' ) ) {
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
        if ('Upfront_ThisPostView' === $view_class || 'Upfront_PostsView' === $view_class) return 'Upfront_CoursePressView';
        return $view_class;
    }

    public function resolve_entity_ids ($cascade) {
        
    	$item = false;
        $type = false;

        $item = get_post_type();//self::_get_post_type();
        $spec = get_queried_object_id();

        $type = 'single';
       

        if (!empty($item)) {
            $cascade['item'] = "coursepress-{$item}"; 
            $cascade['type'] = $type;
            //if (!empty($spec)) {
                $cascade['specificity'] = "coursepress-{$item}".((!empty($spec))?"-{$spec}":"");
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

class Upfront_CoursePressView extends Upfront_Object {

    public function get_markup () {

    	
        rewind_posts();


        ob_start();
        
		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post(); 
				the_content();
				//
				// Post Content here
				//
			} // end while
		} // end if
		else {
			the_content();
		}

        return ob_get_clean();

    }
}

Upfront_Compat_Coursepresspro_Coursepress::serve();