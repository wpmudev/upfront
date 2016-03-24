<?php

class Upfront_Post_Data_PartView_Meta extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'meta'
	);

	public function expand_meta_template () {
		if (empty($this->_post->ID)) return '';

		$out = $this->_get_template('meta');
		if (empty($out)) return $out;

		$codec = Upfront_Codec::get('postmeta');
		$tags = $codec->get_tags($out);

		return empty($tags) && defined('DOING_AJAX') && DOING_AJAX
			? $this->_get_fallback_block(__('Edit your part markup to display meta values.', 'upfront'), 'meta')
			: $codec->expand_all($out, $this->_post)
		;
	}
}