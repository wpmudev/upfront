(function($) {
	
var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/mixins'
], function(Mixins) {
	
	var SliderItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		group: false,
		initialize: function (options) {
			var me = this,
				set_value = function () {
					var value = this.get_value();
					this.model.set_breakpoint_property(this.property_name, value);
				},
				fields = {
					transition: new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: l10n.slider_transition,
						property: 'background_slider_transition',
						use_breakpoint_property: true,
						default_value: 'crossfade',
						icon_class: 'upfront-region-field-icon',
						values: [
							{ label: l10n.slide_down, value: 'slide-down', icon: 'bg-slider-slide-down' },
							{ label: l10n.slide_up, value: 'slide-up', icon: 'bg-slider-slide-up' },
							{ label: l10n.slide_left, value: 'slide-left', icon: 'bg-slider-slide-left' },
							{ label: l10n.slide_right, value: 'slide-right', icon: 'bg-slider-slide-right' },
							{ label: l10n.crossfade, value: 'crossfade', icon: 'bg-slider-crossfade' }
						],
						change: set_value,
						rendered: function (){
							this.$el.addClass('uf-bgsettings-slider-transition');
						}
					}),
					rotate: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						property: 'background_slider_rotate',
						use_breakpoint_property: true,
						default_value: true,
						layout: 'horizontal-inline',
						multiple: false,
						values: [ { label: l10n.autorotate_each + " ", value: true } ],
						change: function () {
							var value = this.get_value();
							this.property.set({value: value ? true : false});
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-slider-rotate');
						}
					}),
					rotate_time: new Upfront.Views.Editor.Field.Number({
						model: this.model,
						property: 'background_slider_rotate_time',
						use_breakpoint_property: true,
						default_value: 5,
						min: 1,
						max: 60,
						step: 1,
						suffix: 'sec',
						change: set_value,
						rendered: function (){
							this.$el.addClass('uf-bgsettings-slider-time');
						}
					}),
					control: new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'background_slider_control',
						use_breakpoint_property: true,
						default_value: 'always',
						layout: 'horizontal-inline',
						values: [
							{ label: l10n.always_show_ctrl, value: 'always' },
							{ label: l10n.show_ctrl_hover, value: 'hover' }
						],
						change: set_value,
						rendered: function (){
							this.$el.addClass('uf-bgsettings-slider-control');
						}
					})
				};
			
			this.$el.addClass('uf-bgsettings-item uf-bgsettings-slideritem');
			
			options.fields = _.map(fields, function(field){ return field; });
			
			// Also add the slides item to the panel settings
			this.slides_item = new SliderSlidesItem({
				model: this.model,
				title: l10n.slides_order + ":"
			});
			if ( !_.isUndefined(options.slides_item_el) ){
				this.slides_item.render();
				options.slides_item_el.append(this.slides_item.$el);
			}
			else {
				this.on('panel:set', function(){
					me.panel.settings.push(me.slides_item);
					me.slides_item.panel = me.panel;
					me.slides_item.trigger('panel:set');
				});
			}
			this.on('show', function(){
				var slide_images = this.model.get_breakpoint_property_value('background_slider_images', true);
				if ( !slide_images )
					me.upload_slider_images();
				me.slides_item.trigger('show');
			});
			this.on('hide', function(){
				me.slides_item.trigger('hide');
			});
			
			
			
			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);
		},
		upload_slider_images: function () {
			var me = this;
			Upfront.Views.Editor.ImageSelector.open({multiple: true}).done(function(images){
				var image_ids = [];
				_.each(images, function(image, id){
					id = parseInt(id, 10);
					if ( id ) {
						image_ids.push(id);
					}
				});
				me.model.set_breakpoint_property('background_slider_images', image_ids);
				//me.update_slider_slides($slides_content);
				me.slides_item.update_slider_slides();
				Upfront.Views.Editor.ImageSelector.close();
			});
		}
	}));
	
	var SliderSlidesItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		initialize: function (options) {
			var me = this;
			
			this.$el.on('click', '.upfront-region-bg-slider-add-image', function (e) {
				e.preventDefault();
				e.stopPropagation();
				Upfront.Views.Editor.ImageSelector.open({multiple: true}).done(function(images){
					var slide_images = _.clone(me.model.get_breakpoint_property_value('background_slider_images', true) || []);
					_.each(images, function(image, id){
						id = parseInt(id, 10);
						if ( id ) {
							slide_images.push(id);
						}
					});
					me.model.set_breakpoint_property('background_slider_images', slide_images);
					Upfront.Views.Editor.ImageSelector.close();
					me.update_slider_slides();
				});
			});
			this.$el.on('click', '.upfront-region-bg-slider-delete-image', function (e) {
				e.preventDefault();
				e.stopPropagation();
				var $image = $(this).closest('.upfront-region-bg-slider-image'),
					image_id = $image.data('image-id'),
					image_index = $image.index(),
					slide_images = _.clone(me.model.get_breakpoint_property_value('background_slider_images', true) || []);
				
				if (_.isString(image_id) && image_id.match(/^[0-9]+$/)) {
					image_id = parseInt(image_id, 10);
				}
				
				if ( image_index != -1 && slide_images.length > 0 ) {
					slide_images.splice(image_index, 1);
				}
				
				me.model.set_breakpoint_property('background_slider_images', slide_images);
				$image.remove();
				
			});
			
			this.on('show', function(){
				me.update_slider_slides();
			});
			
			this.$el.addClass('uf-bgsettings-item uf-bgsettings-slider-slidesitem');
			
			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);
		},
		update_slider_slides: function () {
			var me = this,
				slide_images = me.model.get_breakpoint_property_value('background_slider_images', true),
				$add = $('<div class="upfront-region-bg-slider-add-image upfront-icon upfront-icon-region-add-slide">' + l10n.add_slide + '</div>'),
				$wrap = this.$el.find('.upfront-settings-item-content');
			$wrap.html('');
			
			if ( slide_images.length > 0 ) {
				Upfront.Views.Editor.ImageEditor.getImageData(slide_images).done(function(response){
					var images = response.data.images;
					// Rewrite slide images because in builder mode they will be just paths of theme images
					// and slider needs image objects to work.
					//slide_images = images;
					_.each(slide_images, function (id) {
						var image = _.isNumber(id) || id.match(/^\d+$/) ? images[id] : _.find(images, function(img){
							return img.full[0].split(/[\\/]/).pop() == id.split(/[\\/]/).pop();
						}),
						$image = $('<div class="upfront-region-bg-slider-image" />');
						$image.data('image-id', id);
						if(typeof image.thumbnail !== "undefined") {
							$image.css({
								background: 'url("' + image.thumbnail[0] + '") no-repeat 50% 50%',
								backgroundSize: '100% auto'
							});
						}
						$image.append('<span href="#" class="upfront-region-bg-slider-delete-image">&times;</span>');
						$wrap.append($image);
					});
					if ( $wrap.hasClass('ui-sortable') )
						$wrap.sortable('refresh');
					else
						$wrap.sortable({
							items: '>  .upfront-region-bg-slider-image',
							update: function () {
								var slide_images = [];
								$wrap.find('.upfront-region-bg-slider-image').each(function(){
									var id = $(this).data('image-id');
									id = parseInt(id, 10);
									if ( id ) {
										slide_images.push(id);
									}
								});
								me.model.set_breakpoint_property('background_slider_images', slide_images);
							}
						});
					$wrap.append($add);
				});
			}
			else {
				$wrap.append($add);
			}
		}
	}));

	return SliderItem;
});
})(jQuery);