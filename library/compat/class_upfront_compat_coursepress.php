<?php

class Upfront_Compat_CoursePress {

	private $cp_layouts = array(
		'course'                        => array(
			'display_name' => 'CoursePress Course',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'course_archive'                => array(
			'display_name' => 'CoursePress All Courses',
			'type' => 'single',
			'title' => 'All Courses',
		),
		'unit_archive'                  => array(
			'display_name' => 'CoursePress Course Units',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'unit'                          => array(
			'display_name' => 'CoursePress Course Unit',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'course_notifications_archive'  => array(
			'display_name' => 'CoursePress Course Notifications',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'course_discussion_archive'     => array(
			'display_name' => 'CoursePress Course All Discussions',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'course_discussion'             => array(
			'display_name' => 'CoursePress Course Discussion',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'course_workbook'               => array(
			'display_name' => 'CoursePress Course Workbook',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'course_grades_archive'         => array(
			'display_name' => 'CoursePress Course Grades',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'coursepress_student_login'     => array(
			'display_name' => 'CoursePress Student Login',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'coursepress_student_signup'    => array(
			'display_name' => 'CoursePress Student Signup',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'coursepress_student_dashboard' => array(
			'display_name' => 'CoursePress Courses Dashboard',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'coursepress_student_settings'  => array(
			'display_name' => 'CoursePress Student Settings',
			'type' => 'single',
			'title' => 'Course Number One',
		),
		'coursepress_instructor'  => array(
			'display_name' => 'CoursePress Instructor',
			'type' => 'single',
			'title' => 'Instructor A',
		),
	);

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('CoursePress') === false) return;

		// Force always loading CP styles in builder
		if (upfront_exporter_is_running() && class_exists('CoursePress_Core')) CoursePress_Core::$is_cp_page = true;

		add_filter('upfront-plugins_layouts', array($this, 'add_plugins_layouts'));
		add_filter('upfront-forbidden_post_data_types', array($this, 'forbidden_post_data_types'));
		add_filter('upfront-layout_to_name', array($this, 'layout_to_name'), 10, 4);
		add_filter('upfront-builder_available_layouts', array($this, 'add_builder_available_layouts'));
		add_filter('upfront-post_data-get_content-before', array($this, 'kill_double_discussion_querying'));
		add_filter('upfront-post_data-get_content-after', array($this, 'balance_out_tags_in_discussion_content'));
		add_filter('upfront-post_data-get_content-after', array($this, 'wrap_with_coursepress_css_class'), 99);
	}

	/**
	 * Wrap CoursePress content with css class for easier styling.
	 */
	public function wrap_with_coursepress_css_class($content) {
		$layout = Upfront_Layout::get_parsed_cascade();

		$i = str_replace('single-', '', $layout['item']);

		if (empty($this->cp_layouts[$i])) return $content;

		return '<div class="coursepress-content">' . $content . '</div>';
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
	public function is_coursepress_page($post) {
		if (empty($this->cp_layouts[$post->post_type])) return false;

		return true;
	}

	/**
	 * Force only relevant post data parts in plugin pages. Allow only
	 * title and content.
	 */
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


	/**
	 * List CoursePress layouts to match againts current layout in editor and builder.
	 * This allows editor/builder to hide settings that do not apply and provides sample
	 * content.
	 */
	function add_plugins_layouts($layouts) {
		$sampleContents = array();
		$cpLayouts = array();

		foreach ($this->cp_layouts as $item=>$info) {

			$sampleContents[$item] = $this->get_sample_content($item);

			$cpLayouts[] = array(
				'item' => 'single-' . $item,
				'specificity' => 'single-' . $item,
				'type' => $info['type'],
				'content' => $item,
				'title' => __($info['title'], 'upfront'),
				'display_name' => __($info['display_name'], 'upfront'),
				'killPostSettings' => __('This is virtual page handled by CoursePress.', 'upfront'),
			);
		}

		$layouts['course-press'] = array(
			'pluginName' => 'CoursePress',
			'sampleContents' => $sampleContents,
			'layouts' => $cpLayouts
		);

		return $layouts;
	}

	/**
	 * Translate layout names for builder "Layouts" popup.
	 */
	public function layout_to_name($layout_name, $type, $item, $specificity) {
		$s = str_replace('single-', '', $specificity);

		if (!empty($this->cp_layouts[$s])) return __($this->cp_layouts[$s]['display_name'], 'upfront');

		return $layout_name;
	}

	/**
	 * Add CoursePress layouts to builder "Layouts" popup.
	 */
	public function add_builder_available_layouts($layouts) {
		foreach( $this->cp_layouts as $item=>$info) {
			$layouts[] = array(
				'layout' => array(
					'type' => $info['type'],
					'item' => $item,
					'specificity' => 'single-' . $item
				)
			);
		}

		return $layouts;
	}
}
