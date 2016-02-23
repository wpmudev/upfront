(function ($) {
define([
	'text!elements/upfront-slider/tpl/backend.html',
], function(editorTpl) {
	var l10n = Upfront.Settings.l10n.slider_element;

	var SlidesField = Upfront.Views.Editor.Field.Field.extend({
		template: _.template($(editorTpl).find('#slides-setting-tpl').html()),
		events: {
			'click .uslider-add' : 'addSlides',
			'click .remove-slide' : 'onRemoveSlide'
		},
		initialize: function(){
			this.listenTo(this.model.slideCollection, 'add remove sort reset', this.render);
		},

		onRemoveSlide: function(event) {
			this.model.view.removeSlide($(event.currentTarget).parent());
		},

		render: function() {
			var me = this;
			this.$el.html(this.template({slides: this.model.slideCollection, l10n: l10n}));

			//Make the thumbs sortable
			this.$('.uslider-slides-setting').sortable({
				items: '.uslider_content_imgslide',
				start: function(event, ui) {
					ui.item.addClass('uslider-is-dragged');
				},
				stop: function(event, ui) {
					// When the drag stops we record the list of IDs into our array for use later.
					var slideId = ui.item.attr('rel'),
						newPosition = me.getSlidePosition(slideId),
						slide = false;

					if(newPosition != -1) {
						slide = me.model.slideCollection.get(slideId);
						me.model.slideCollection.remove(slideId, {silent:true});
						me.model.slideCollection.add(slide, {at: newPosition});
					}
				}
			});

			setTimeout(function(){
				var settings = $('#settings');
				settings.height(settings.find('.upfront-settings_panel:visible').outerHeight());
			},100)

		},

		addSlides: function(){
			this.model.trigger('addRequest');
		},

		getSlidePosition: function(slideId){
			var i = 0,
				found = false;
			this.$('div.uslider_content_slide').each(function(item){
				if($(this).attr('rel') == slideId)
					found = i;
				i++;
			});
			if(found !== false)
				return found;
			return -1;
		},
		get_name: function() {
			return 'slides';
		},
		get_value: function() {
			return this.model.slideCollection.toJSON();
		}
	});

	return SlidesField;
});
})(jQuery);
