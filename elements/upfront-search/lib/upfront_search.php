<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UsearchView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$label = $this->_get_property("label");
		$label = !empty($label) && '__image__' != $label
			? $label
			: '<i class="icon-search"></i>'
		;

		$placeholder = $this->_get_property("placeholder");
		$placeholder = $placeholder ? "placeholder='{$placeholder}'" : '';

		$rounded = $this->_get_property("is_rounded") ? 'rounded' : '';

		$color = $this->_get_property("color");
		$color = $color ? "style='background-color:{$color};'" : '';

		return "<div class='upfront-output-object upfront-search {$rounded}' {$color} {$element_id}>" .
			"<form action='" . esc_url( home_url( '/' ) ) . "' method='GET'>" .
			"<input type='search' class='search-field' name='s' value='' {$placeholder} /><button class='search-button'>{$label}</button>" .
			'</form>' .
		"</div>";
	}
}