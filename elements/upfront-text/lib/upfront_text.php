<?php

class Upfront_PlainTxtView extends Upfront_Object {

	public function get_markup () {

		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$content = $this->_get_property('content');

		$matches = array();
		$regex = '/<div class="plaintxt_padding([^>]*)>(.+?)<\/div>/s';
		preg_match($regex, $content, $matches);

		if(sizeof($matches) > 1)
			$content = $matches[2];

		$style = array();
		if($this->_get_property('background_color') && $this->_get_property('background_color')!='')
			$style[] = 'background-color: '.$this->_get_property('background_color');

		if($this->_get_property('border') && $this->_get_property('border')!='')
			$style[] = 'border: '.$this->_get_property('border');

		return "<div {$element_id}>".(sizeof($style)>0 ? "<div class='plaintxt_padding' style='".implode(';', $style)."'>": ''). $content .(sizeof($style)>0 ? "</div>": ''). '</div>';
	}
}