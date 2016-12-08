(function($) {

define(function(){
	return {
		bind_toggles: function () {
			this.on('show', function(){
				this.$el.show();
			});
			this.on('hide', function(){
				this.$el.hide();
			});
		},
		save_fields: function () {
			// changes are auto saved, no need to invoke this, so blank it out
		},
		preview_color: function (color) {
			if( !_.isObject( color ) ) return;
			var rgb = color.toRgb(),
				rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')'
			;

			rgba_string = color.get_is_theme_color() !== false ?  color.theme_color : rgba_string;
			if ( typeof this.is_featured_fallback_bg_color !== 'undefined' && this.is_featured_fallback_bg_color ) {
				this.model.set_breakpoint_property('featured_fallback_background_color', rgba_string);
			} else {
				this.model.set_breakpoint_property('background_color', rgba_string);
			}
		},
		update_color: function (color) {
			this.preview_color(color);
			if ( typeof this.is_featured_fallback_bg_color !== 'undefined' && this.is_featured_fallback_bg_color ) {
				this._default_color = this.model.get_breakpoint_property_value('featured_fallback_background_color', true);
			} else {
				this._default_color = this.model.get_breakpoint_property_value('background_color', true);
			}
		},
		reset_color: function () {
			if ( typeof this.is_featured_fallback_bg_color !== 'undefined' && this.is_featured_fallback_bg_color ) {
				this.model.set_breakpoint_property('featured_fallback_background_color', this._default_color);
			} else {
				this.model.set_breakpoint_property('background_color', this._default_color);
			}
		},
		upload_image: function () {
			var me = this;
			Upfront.Views.Editor.ImageSelector.open().done(function(images){
				var sizes = {},
					image_id;
				_.each(images, function(image, id){
					sizes = image;
					image_id = id;
				});
				$('<img>').attr('src', sizes.full[0]).load(function(){
					Upfront.Views.Editor.ImageSelector.close();
					me.model.set_breakpoint_property('background_image', sizes.full[0]);
					me.model.set_breakpoint_property('background_image_ratio', Math.round(sizes.full[2]/sizes.full[1]*100)/100);
				});
			});
		}
	};
});

})(jQuery);
