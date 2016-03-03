<?php

class Upfront_Region_Sub_Container extends Upfront_Region_Container {
	protected $_type = 'Region_Sub_Container';

	public function get_sub () {
		return !empty($this->_data['sub']) ? $this->_data['sub'] : false;
	}

	public function get_css_class () {
		$classes = parent::get_css_class();
		$more_classes = array();
		$more_classes[] = 'upfront-region-sub-container-' . $this->get_sub();
		return $classes . ' ' . join(' ', $more_classes);
	}

	public function wrap ($out, $before = '', $after = '') {
		return parent::wrap($out, '', '');
	}
}