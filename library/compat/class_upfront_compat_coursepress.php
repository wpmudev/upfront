<?php

class Upfront_Compat_CoursePress {

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('CoursePress') === false) return;

		// Force always loading CP styles in builder
		if (upfront_exporter_is_running() && class_exists('CoursePress_Core')) CoursePress_Core::$is_cp_page = true;

		add_filter('upfront_pre_get_post_markup_use_post', array($this, 'use_post'), 10, 3);
		add_filter('upfront-plugins_layouts', array($this, 'add_plugins_layouts'));
		add_filter('upfront-forbidden_post_data_types', array($this, 'forbidden_post_data_types'));
		add_filter('upfront-layout_to_name', array($this, 'layout_to_name'), 10, 4);
		add_filter('upfront-builder_available_layouts', array($this, 'add_builder_available_layouts'));
		add_filter('upfront-post_data-get_content-before', array($this, 'kill_double_discussion_querying'));
		add_filter('upfront-post_data-get_content-after', array($this, 'balance_out_tags_in_discussion_content'));
	}

	/**
	 * CoursePress seems to be missing one closing div tag in generated content for single discussion, so just
	 * add it here until that is resolved in CoursePress.
	 */
	public function balance_out_tags_in_discussion_content($content) {
		$layout = Upfront_Layout::get_parsed_cascade();

		if ($layout['item'] !== 'single-course_discussion') return $content;

		return $content . '</div>';
	}

	/**
	 * This one is complicated.
	 * Apparently, when post data part view such as title or content is doing get_markup it actually calls
	 * get_markup of post data, which causes post data content to be rendered multiple times, at least twice.
	 * On single discussion page if content render is called more than once db error will happen because
	 * WP will query comments with broken SQL. So, here we watch when get_content is called first time to
	 * return any non-empty string so that content would not be rendered. After that let it do it's own thing.
	 * Post data render will be called exactly twice, since in discussion template there is exactly two post
	 * data parts, title and content, and user does not have means to add another unless he edits actual layout
	 * file. (post data parts UI is disabled in plugin pages).
	 */
	private $discussion_page_query_call_no = 0;
	public function kill_double_discussion_querying($content) {
		$layout = Upfront_Layout::get_parsed_cascade();

		if ($layout['item'] !== 'single-course_discussion') return '';

		if ($this->discussion_page_query_call_no === 0) {
			$this->discussion_page_query_call_no = 1;
			return 'emptiness'; // Yep, not important what it says, just needs to be non-empty string
		}

		return '';
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
		return $use;
	}

	public function forbidden_post_data_types($types) {
		$post = get_post();
		if (is_null($post)) return $types;

		if (self::is_coursepress_page($post)) {
			$types = array('date_posted', 'comment_form', 'comment_count', 'comments', 'comments_pagination');
		}
		return $types;
	}

	public function get_sample_content($specificity) {
		ob_start();
		include(get_theme_root() . DIRECTORY_SEPARATOR . 'upfront'. DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . 'compat' . DIRECTORY_SEPARATOR . 'coursepress' . DIRECTORY_SEPARATOR . $specificity . '.php');
		return  ob_get_clean();
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
			'course_grades_archive' => $this->get_sample_content('course_grades_archive'),
			'coursepress_student_login' => $this->get_sample_content('coursepress_student_login'),
			'coursepress_student_signup' => $this->get_sample_content('coursepress_student_signup'),
			'coursepress_student_dashboard' => $this->get_sample_content('coursepress_student_dashboard'),
			'coursepress_student_settings' => $this->get_sample_content('coursepress_student_settings'),
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
					'displayname' => __('CoursePress Course page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-course_archive',
					'specificity' => 'single-course_archive',
					'type' => 'single',
					'content' => 'course_archive',
					'title' => __('All Courses', 'upfront'),
					'displayname' => __('CoursePress Course Archive page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-unit_archive',
					'specificity' => 'single-unit_archive',
					'type' => 'single',
					'content' => 'unit_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Units page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-unit',
					'specificity' => 'single-unit',
					'type' => 'single',
					'content' => 'unit',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Unit page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-course_notifications_archive',
					'specificity' => 'single-course_notifications_archive',
					'type' => 'single',
					'content' => 'course_notifications_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Notifications page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-course_discussion_archive',
					'specificity' => 'single-course_discussion_archive',
					'type' => 'single',
					'content' => 'course_discussion_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Discussions page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-course_discussion',
					'specificity' => 'single-course_discussion',
					'type' => 'single',
					'content' => 'course_discussion',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Discussion page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-course_workbook',
					'specificity' => 'single-course_workbook',
					'type' => 'single',
					'content' => 'course_workbook',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Workbook page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-course_grades_archive',
					'specificity' => 'single-course_grades_archive',
					'type' => 'single',
					'content' => 'course_grades_archive',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Course Workbook page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-coursepress_student_login',
					'specificity' => 'single-coursepress_student_login',
					'type' => 'single',
					'content' => 'coursepress_student_login',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Student Login page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-coursepress_student_signup',
					'specificity' => 'single-coursepress_student_signup',
					'type' => 'single',
					'content' => 'coursepress_student_signup',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Student Signup page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-coursepress_student_dashboard',
					'specificity' => 'single-coursepress_student_dashboard',
					'type' => 'single',
					'content' => 'coursepress_student_dashboard',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Courses Dashboard page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
				array(
					'item' => 'single-coursepress_student_settings',
					'specificity' => 'single-coursepress_student_settings',
					'type' => 'single',
					'content' => 'coursepress_student_settings',
					'title' => __('Course Number One', 'upfront'),
					'displayname' => __('CoursePress Student Settings page', 'upfront'),
					'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
				),
			)
		);

		return $layouts;
	}

	public function layout_to_name($layout_name, $type, $item, $specificity) {
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

		if ($specificity === 'single-course_grades_archive') {
			return __('CoursePress Course Grades', 'upfront');
		}
		if ($specificity === 'single-coursepress_student_login') {
			return __('CoursePress Student Login', 'upfront');
		}
		if ($specificity === 'single-coursepress_student_signup') {
			return __('CoursePress Student Signup', 'upfront');
		}
		if ($specificity === 'single-coursepress_student_dashboard') {
			return __('CoursePress Courses Dashboard', 'upfront');
		}
		if ($specificity === 'single-coursepress_student_settings') {
			return __('CoursePress Student Settings', 'upfront');
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
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'course_grades_archive',
				'specificity' => 'single-course_grades_archive'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'coursepress_student_login',
				'specificity' => 'single-coursepress_student_login'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'coursepress_student_signup',
				'specificity' => 'single-coursepress_student_signup'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'coursepress_student_dashboard',
				'specificity' => 'single-coursepress_student_dashboard'
			)
		);
		$layouts[] = array(
			'layout' => array(
				'type' => 'single',
				'item' => 'coursepress_student_settings',
				'specificity' => 'single-coursepress_student_settings'
			)
		);

		return $layouts;
	}
}
