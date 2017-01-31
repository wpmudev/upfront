<?php

class Upfront_Compat_SiteCategories {

	public function __construct() {
		add_filter('upfront-postdata_get_markup_before', array($this, 'override_postdata_content'), 10, 2);
		add_filter('upfront-override_post_parts', array($this, 'override_post_parts'), 10, 2);
		add_filter('upfront-post_data-get_content-before', array($this, 'override_postdata_content'));
	}

    public function override_postdata_content($content, $post_type) {
		$content = $this->get_site_categories_content();
		$content = apply_filters( 'the_content', $content );
    $content = str_replace( ']]>', ']]&gt;', $content );
		return '<div class="woocommerce">' . $content . '</div>';
        return $content;
    }


	public function override_post_parts($parts, $post_type) {
		return "post parts";
	}

    public function get_site_categories_content() {
        ob_start();
        $content = ob_get_clean();
		//$content .= $site_categories->process_categories_body ($content);
		$content .= "sc content";
        return $content;
    }
}
