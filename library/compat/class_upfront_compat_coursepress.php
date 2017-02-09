<?php

class Upfront_Compat_CoursePress {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('CoursePress') === false) return;

		add_filter('upfront_pre_get_post_markup_use_post', array($this, 'use_post'), 10, 3);
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'override_entity_ids'));
		add_filter('upfront-layout-from_entity_ids', array($this, 'override_layout_cascade'));
		add_filter('upfront-plugins_layouts', array($this, 'add_plugins_layouts'));
		add_filter('upfront-forbidden_post_data_types', array($this, 'forbidden_post_data_types'));
		add_filter('upfront-layout_to_name', array($this, 'layout_to_name'), 10, 4);
		add_filter('upfront-builder_available_layouts', array($this, 'add_builder_available_layouts'));
		return;
		add_filter('upfront-posts-get_markup-before', array($this, 'override_posts_markup_filter'));
		add_filter('upfront-postdata_get_markup_before', array($this, 'override_postdata_content'), 10, 2);
		add_filter('template_include', array($this, 'override_single_product_tpl'), 99, 3);
		add_filter('upfront-post_data-get_content-before', array($this, 'override_single_product_filter'));
		add_filter('upfront-widget_plugins_widgets', array($this, 'declare_plugins_widgets'));
	}

	public function override_layout_cascade($cascade) {
		return $cascade;
	}

	/**
	 * Checks against post object if current page is CoursePress page.
	 *
	 * @param WP_Post|int $post Post to check
	 *
	 * @return bool
	 */
	public static function is_coursepress_page($post) {
		$cp_post_types = array(
			'course_notifications_archive',
			'course_discussion_archive',
			'coursepress_student_dashboard',
			'coursepress_student_signup',
			'coursepress_student_login',
			'unit',
			'course',
			'course_grades_archive',
			'course_archive',
			'course_workbook',
			'coursepress_instructor'
		);

		error_log(json_encode(array($post->post_type)));

		if (in_array($post->post_type, $cp_post_types)) return true;

		return false;
	}

	/**
	 * Filter to determine if current page is CoursePress page.
	 */
	public function use_post($use, $post, $properties) {
		if (self::is_coursepress_page($post)) {
			return true;
		}
		return $markup;
	}

	public function forbidden_post_data_types($types) {
		$post = get_post();
		if (is_null($post)) return $types;

		if (self::is_coursepress_page($post)) {
			$types = array('date_posted', 'comment_form', 'comment_count', 'comments', 'comments_pagination');
		}
		return $types;
	}

	/**
	 * Returns a list of known Woo pages as a list of post IDs
	 *
	 * @return array List of post IDs
	 */
	public static function get_woo_page_ids () {
		return $pages = array(
			wc_get_page_id('cart'),
			wc_get_page_id('checkout'),
			wc_get_page_id('myaccount'),
			wc_get_page_id('shop')
		);
	}

	/**
	 * Overrides Woo's internal template injection
	 *
	 * Forces loading Upfront's single.php/index.php
	 *
	 * @param string $tpl Template
	 *
	 * @return string
	 */
	public function override_single_product_tpl ($tpl) {
		if (preg_match('/\bwoocommerce\b/', $tpl)) {
			if (preg_match('/single-product\.php$/', $tpl)) return locate_template('single.php');
			if (preg_match('/archive-product.*\.php$/', $tpl)) {
				return locate_template('index.php');
			}
			if (preg_match('/(taxonomy|archive)-product.*\.php$/', $tpl)) return locate_template('index.php');
		}
		return $tpl;
	}

	/**
	 * Overrides the entity IDs when we're dealing with Woo output
	 *
	 * This will force using the appropriate layout
	 *
	 * @param array $cascade Upfront layout IDs cascade
	 *
	 * @return array
	 */
	public function override_entity_ids ($cascade) {
		error_log(json_encode($cascade));
		return $cascade;

		$theme = Upfront_Theme::get_instance();

		if (!empty($cascade['item']) && 'single-product' === $cascade['item']) {
			// Let's test if a theme supports Woo product layouts.
			// As in, does this theme have single-product ready-made layouts?

			// If it doesn't, let's emulate - we'll be single pages here
			if (!$theme->has_theme_layout('single-product')) $cascade['item'] = 'single-page';

		} else if (!empty($cascade['specificity'])) {
			// Swap single-page-{number} with specific layouts
			$s = $cascade['specificity'];
			$layouts = array(
				'single-page-woocart'      => 'single-page-' . wc_get_page_id('cart'),
				'single-page-wooccheckout' => 'single-page-' . wc_get_page_id('checkout'),
				'single-page-woomyaccount' => 'single-page-' . wc_get_page_id('myaccount'),
			);

			foreach ($layouts as $slug=>$specificity) {
				if ($s === $specificity) {
					if ($theme->has_theme_layout($slug)) $cascade['specificity'] = $slug;
					break;
				}
			}

		} else {
			// If all else fails try to find out if this really isn't the shop page.
			// When in General > Permalinks > Product Permalinks
			// selected value is not Default, shop page resolves to archive instead archive-product
			global $wp_query;
			if (empty($cascade['item']) && $wp_query->is_archive && $wp_query->queried_object_id === wc_get_page_id('shop')) {
				$cascade['item'] = 'archive-product';
			}
		}

		return $cascade;
	}

	/**
	 * Inject Woo stuff into content instead of the normal content
	 *
	 * @param bool|string $status Whatever we got this far, defaults to (bool)false
	 *
	 * @return bool|string
	 */
	public function override_single_product_filter ($status) {
		$post = get_post();
		if (empty($post->post_type) || 'product' !== $post->post_type) return $status;

		return $this->get_woo_content();
	}

	public function get_sample_content($specificity) {
		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'coursepress' . DIRECTORY_SEPARATOR . $specificity . '.php');
		return  ob_get_clean();
	}

	/**
	 * Inject Woo stuff into content instead of the normal content. Doing this on posts element since
	 * there is no logic for user to use anything else on WC pages.
	 *
	 * @param bool|string $status Whatever we got this far, defaults to (bool)false
	 *
	 * @return bool|string
	 */
	public function override_posts_markup_filter ($status) {
		error_log('override_posts_markup_filter');
		// The scope of the issue this addresses stays with archive page
		if (is_singular()) return $status; // ... so don't do this on singular pages

		$post = get_post();
		if (empty($post->post_type) || 'product' !== $post->post_type) return $status;

		return $this->get_woo_content();
	}

	// List WC layouts to match againts current layout in editor
	function add_plugins_layouts($layouts) {
		$sampleContents = array(
			'course' => $this->get_sample_content('course'),
			'course_archive' => $this->get_sample_content('course_archive'),
			'unit_archive' => $this->get_sample_content('unit_archive'),
			'unit' => $this->get_sample_content('unit'),
			'course_notifications_archive' => $this->get_sample_content('course_notifications_archive'),
			'course_discussion_archive' => $this->get_sample_content('course_discussion_archive'),
			'course_discussion' => $this->get_sample_content('course_discussion'),
			'course_workbook' => $this->get_sample_content('course_workbook'),
		);

		$layouts['course-press'] = array(
			'pluginName' => 'CoursePress',
			'sampleContents' => $sampleContents,
			'layouts' => array(
				array(
					'item' => 'single-course',
					'specificity' => 'single-course',
					'type' => 'single',
					'content' => 'course',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course page', 'upfront')
				),
				array(
					'item' => 'single-course_archive',
					'specificity' => 'single-course_archive',
					'type' => 'single',
					'content' => 'course_archive',
					'title' => __('All Courses', 'upfront'),
					'displayname' => __('CoursePress Course Archive page', 'upfront')
				),
				array(
					'item' => 'single-unit_archive',
					'specificity' => 'single-unit_archive',
					'type' => 'single',
					'content' => 'unit_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Units page', 'upfront')
				),
				array(
					'item' => 'single-unit',
					'specificity' => 'single-unit',
					'type' => 'single',
					'content' => 'unit',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Unit page', 'upfront')
				),
				array(
					'item' => 'single-course_notifications_archive',
					'specificity' => 'single-course_notifications_archive',
					'type' => 'single',
					'content' => 'course_notifications_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Notifications page', 'upfront')
				),
				array(
					'item' => 'single-course_discussion_archive',
					'specificity' => 'single-course_discussion_archive',
					'type' => 'single',
					'content' => 'course_discussion_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Discussions page', 'upfront')
				),
				array(
					'item' => 'single-course_discussion',
					'specificity' => 'single-course_discussion',
					'type' => 'single',
					'content' => 'course_discussion',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Discussion page', 'upfront')
				),
				array(
					'item' => 'single-course_workbook',
					'specificity' => 'single-course_workbook',
					'type' => 'single',
					'content' => 'course_workbook',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Workbook page', 'upfront')
				),
			)
		);

		return $layouts;
	}

	/**
	 * Force CP content in post data.
	 */
	public function override_postdata_content($content, $post_type) {
		error_log($content.' //// ' . $post_type);
		return $content;
	}

	public function override_post_parts($parts, $post_type) {
		error_log('override_post_parts');
		return $parts;
	}

	private function get_woo_content() {
		ob_start();
		woocommerce_content();
		$content = ob_get_clean();
		wp_reset_postdata();
		if ($content === '') return '';
		return '<div class="woocommerce">' . $content . '</div>';
	}

	public function declare_plugins_widgets($pw) {
		return array_merge($pw, array(
				array(
					'class' => 'WC_Widget_Layered_Nav',
					'text' => 'WooCommerce Layered Navigation Widget'
				),
				array(
					'class' => 'WC_Widget_Layered_Nav_Filters',
					'text' => 'WooCommerce Layered Navigation Filters Widget'
				),
				array(
					'class' => 'WC_Widget_Price_Filter',
					'text' => 'WooCommerce Price Filter Widget'
				),
				array(
					'class' => 'WC_Widget_Rating_Filter',
					'text' => 'WooCommerce Rating Filter Widget'
				),
				array(
					'class' => 'WC_Widget_Recent_Reviews',
					'text' => 'WooCommerce Recent Reivews Widget'
				),
				array(
					'class' => 'WC_Widget_Recently_Viewed',
					'text' => 'WooCommerce Recently Viewed Widget'
				),
			)
		);
	}

	public function layout_to_name($layout_name, $type, $item, $specificity) {
		error_log(json_encode(array($type, $item, $specificity)));
		if ($specificity === 'single-course') {
			return __('CoursePress Course', 'upfront');
		}
		if ($specificity === 'single-course_archive') {
			return __('CoursePress All Courses', 'upfront');
		}
		if ($specificity === 'single-unit_archive') {
			return __('CoursePress Course Units', 'upfront');
		}

		if ($specificity === 'single-unit') {
			return __('CoursePress Course Unit', 'upfront');
		}

		if ($specificity === 'single-course_notifications_archive') {
			return __('CoursePress Course Notifications', 'upfront');
		}

		if ($specificity === 'single-course_discussion_archive') {
			return __('CoursePress Course All Discussions', 'upfront');
		}

		if ($specificity === 'single-course_discussion') {
			return __('CoursePress Course Discussion', 'upfront');
		}

		if ($specificity === 'single-course_workbook') {
			return __('CoursePress Course Workbook', 'upfront');
		}

		return $layout_name;
	}

	public function add_builder_available_layouts($layouts) {
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course',
				'specificity' => 'single-course'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course_archive',
				'specificity' => 'single-course_archive'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'unit_archive',
				'specificity' => 'single-unit_archive'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'unit',
				'specificity' => 'single-unit'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course_notifications_archive',
				'specificity' => 'single-course_notifications_archive'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course_discussion_archive',
				'specificity' => 'single-course_discussion_archive'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course_discussion',
				'specificity' => 'single-course_discussion'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course_workbook',
				'specificity' => 'single-course_workbook'
			)
		);

		return $layouts;
	}
}
