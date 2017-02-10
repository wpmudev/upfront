;(function($){
	define(function(){
	var l10n = Upfront.Settings.l10n.media;
	var INSERT_OPTIONS = {
		uf_insert: 'image_insert',
		wp_insert: 'wp_default'
	};

	var Options_Control = Backbone.View.extend({
		events: {
			"click a.upfront-media-insert-option-toggle": "toggle_option"
		},
		initialize: function(opts){

		},
		render: function(){
			var insert_option = this.model.at(0).get("insert_option") || INSERT_OPTIONS.uf_insert,
				active_class = insert_option == INSERT_OPTIONS.uf_insert ? 'active' : 'inactive'
			;
			this.$el.empty();
			this.$el.append('<a class="upfront-media-insert-option-toggle ' + active_class + '"></a>');
			this.$el.append('<label class="upfront-field-label upfront-field-label-block">'+ l10n.full_size +'</label>');

			return  this;
		},
		toggle_option: function(e) {
			e.stopPropagation();
			e.preventDefault();
			var insert_option = this.model.at(0).get("insert_option") || INSERT_OPTIONS.uf_insert;
			this.model.at(0).set("insert_option", insert_option == INSERT_OPTIONS.uf_insert ? INSERT_OPTIONS.wp_insert : INSERT_OPTIONS.uf_insert);
			this.render();
		}
	});

	return {
		Options_Control: Options_Control,
		INSERT_OPTIONS: INSERT_OPTIONS
	};

//End Define
   });
})(jQuery);
