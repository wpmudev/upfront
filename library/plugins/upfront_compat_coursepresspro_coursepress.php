<?php

class Upfront_Compat_Coursepresspro_Coursepress extends Upfront_Server {

    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        
        add_action('wp', array($this, 'detect_virtual_page'));
        
        add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9);
        
        add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"), 9);  


        //exporter, CoursePress specific layouts
        //add_filter('upfront-core-default_layouts', array($this, 'augment_default_layouts'));
    }


    public function detect_virtual_page () {

       
		if ( class_exists( 'CoursePress' ) ) {
            add_filter('upfront-views-view_class', array($this, 'override_view'));
            add_filter('upfront-entity_resolver-entity_ids', array($this, 'resolve_entity_ids'));
        }
            
    }

    /**
     * Augments the available layouts list by adding some CoursePress-specific ones.
     *
     * @param array $layouts Predefined Upfront layouts
     *
     * @return array Augmented layouts list
     */
    public function augment_default_layouts ($layouts) {
       
        $layouts["coursepress-course-archive"] = array(
            'label' => "CoursePress Course Archive",
            'layout' => array(
                'type' => 'archive',
                'item' => "coursepress-course",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-course"] = array(
            'label' => "CoursePress Course",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-course",
                'specificity' => "coursepress-course",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-units"] = array(
            'label' => "CoursePress Course Units",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-units",
                'specificity' => "coursepress-units",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-unit"] = array(
            'label' => "CoursePress Unit",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-unit",
                'specificity' => "coursepress-unit",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-workbook"] = array(
            'label' => "CoursePress Workbook",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-workbook",
                'specificity' => "coursepress-workbook",
                'plugin' => 'plugin'
            )
        );
       
        $layouts["coursepress-grades"] = array(
            'label' => "CoursePress Grades",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-grades",
                'specificity' => "coursepress-grades",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-discussions"] = array(
            'label' => "CoursePress Discussions",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-discussions",
                'specificity' => "coursepress-discussions",
                'plugin' => 'plugin'
            )
        );
        
        $layouts["coursepress-notifications"] = array(
            'label' => "CoursePress Notifications",
            'layout' => array(
                'type' => 'single',
                'item' => "coursepress-notifications",
                'specificity' => "coursepress-notifications",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-messages-inbox"] = array(
            'label' => "CoursePress Messages Inbox",
            'layout' => array(
                'type' => 'archive',
                'item' => "coursepress-messages-inbox",
                'plugin' => 'plugin'
            )
        );

         $layouts["coursepress-messages-new"] = array(
            'label' => "CoursePress Messages New",
            'layout' => array(
                'type' => 'archive',
                'item' => "coursepress-messages-new",
                'plugin' => 'plugin'
            )
        );

        $layouts["coursepress-messages-sent"] = array(
            'label' => "CoursePress Messages Sent",
            'layout' => array(
                'type' => 'archive',
                'item' => "coursepress-messages-sent",
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
        global $coursepress;
        $url = trim( parse_url( $_SERVER[ 'REQUEST_URI' ], PHP_URL_PATH ), '/' );
    	$item = false;
        $type = false;
        $content_type = false;

        $item = get_post_type();
        $spec = get_queried_object_id();
        $type = 'single';
        $content_type = get_query_var('post_type');

        if($content_type == 'course') {
            $item = 'course';

            if(empty(get_query_var('course'))) {
                $type = 'archive';
            }
            else {
                $type = 'single';
            }
        }
        elseif($content_type == 'unit') {
            

            if ( preg_match( '/' . $coursepress->get_units_slug() . '/', $url ) ) {
                $item = 'units';
            }
            elseif ( preg_match( '/' . $coursepress->get_workbook_slug() . '/', $url ) ) {
                $item = 'workbook';
            }
            elseif ( preg_match( '/' . $coursepress->get_grades_slug() . '/', $url ) ) {
                $item = 'grades';
            }

            $meta_query = get_query_var('meta_query');

            if(is_array($meta_query) && isset($meta_query[0]) && isset($meta_query[0]['value']))
                $spec = $meta_query[0]['value'];


            $type = 'single';
        }
        elseif($content_type == 'discussions') {
            $type = 'single';
            $item = $content_type;
            $spec = get_query_var('meta_value');
        }
        elseif($content_type == 'notifications') {
            $type = 'single';
            $item = $content_type;

            $meta_query = get_query_var('meta_query');

            if(is_array($meta_query) && isset($meta_query[0]) && isset($meta_query[0]['value']))
                $spec = $meta_query[0]['value'];
        }
        elseif(!empty(get_query_var('unitname'))) {
            //it is a single unit
            $type = 'single';
            $item = 'unit';

            //lets find its id
           $args=array(
              'name' => get_query_var('unitname'),
              'post_type' => 'unit',
                'post_status' => 'publish',
              'showposts' => 1,
              'caller_get_posts'=> 1
            );
            $my_posts = get_posts($args);
            if( $my_posts )
                $spec = $my_posts[0]->ID;
        
        }
        elseif ( preg_match( '/' . $coursepress->get_inbox_slug() . '/', $url ) ) {
            $item = 'messages-inbox';
            $type = 'archive';
        }

        elseif ( preg_match( '/' . $coursepress->get_new_message_slug() . '/', $url ) ) {
            $item = 'messages-new';
            $type = 'archive';
        }

        elseif ( preg_match( '/' . $coursepress->get_sent_messages_slug() . '/', $url ) ) {
            $item = 'messages-sent';
            $type = 'archive';
        }


        if (!empty($item)) {
            $cascade['item'] = "coursepress-{$item}"; 
            $cascade['type'] = $type;
            if (!empty($spec))
                $cascade['specificity'] = "coursepress-{$item}".((!empty($spec))?"-{$spec}":"");
            
            $cascade['plugin'] = 'plugin';
            
        }
		
        return $cascade;

    }
    public function load_markup () {

        $data = stripslashes_deep($_POST);

        if (empty($data['layout']['item']) && empty($data['layout']['specificity'])) return false; // Don't deal with this if we don't know what it is



        $has_course_item = !empty($data['layout']['item']) && !(strpos($data['layout']['item'], 'coursepress') === false);
        $has_course_spec = !empty($data['layout']['specificity']) && !(strpos($data['layout']['specificity'], 'coursepress') === false);


        if (!$has_course_item && !$has_course_spec) return false;

        $this->_out(new Upfront_JsonResponse_Success(array(
            "filtered" => '<div class="upfront-coursepress_compat upfront-plugin_compat"><p>CoursePress specific content</p></div>'
        )));
       

    }

    public function load_posts () {
        
        $data = stripslashes_deep($_POST);

        if (empty($data['layout']['item'])) return false; // Don't deal with this if we don't know what it is

        $has_course_item = !(strpos($data['layout']['item'], 'coursepress') === false);

        if (!$has_course_item )
            return false;
  
        
        $this->_out(new Upfront_JsonResponse_Success(array(
            'posts' => '<div class="upfront-coursepress_compat upfront-plugin_compat"><p>CoursePress specific content</p></div>',
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