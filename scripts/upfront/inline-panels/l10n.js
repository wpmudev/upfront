define(function() {
	return (((Upfront.mainData || {}).l10n || {}).image_element)
		? Upfront.mainData.l10n.image_element
		: {
			css: {}, ctrl: {}, settings: {}, btn: {}, sel: {}, template: {} // Spell out nested objects :(
		}
	;
});
