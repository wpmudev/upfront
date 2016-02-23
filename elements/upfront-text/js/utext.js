(function ($) {
	define([
		'elements/upfront-text/js/model',
		'elements/upfront-text/js/element',
		'elements/upfront-text/js/settings',
		'elements/upfront-text/js/menu',
		'text!elements/upfront-text/tpl/utext.html',
		'scripts/upfront/preset-settings/util'
	], function(UtextModel, TextElement, TextSettings, TextMenu, textTpl, PresetUtil) {

		var l10n = Upfront.Settings.l10n.text_element;

		var TextView = Upfront.Views.ObjectView.extend({
			// className: 'upfront-plain_txt', THIS ONE TRIPLICATES CLASSNAME MAKING CSS A HELL
			initialize: function() {
				this.constructor.__super__.initialize.apply(this, arguments);

				if(! (this.model instanceof UtextModel)){
					this.model = new UtextModel({properties: this.model.get('properties')});
				}

				/**
				 * Commenting the following because it caused the ueditor to restore draggablity while it was still editable
				 */
				//this.on('deactivated', function() {
				//	console.log('deactivating the text element editor');
				//	Upfront.Events.trigger('upfront:element:edit:stop');
				//}, this);
				this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors, this);
				this.listenTo(Upfront.Events, 'upfront:lightbox:show', this.on_lightbox_show);
				this.listenTo(this.model, "preset:updated", this.preset_updated);
				this.listenTo(this.model, 'change', this.render);
			},
			preset_updated: function() {
				this.render();
			},
			on_lightbox_show: function() {
				// Turn off the editor, hide the redactor bars, clean up the view
				ed = this.$el.find('.upfront-object-content').data("ueditor");

				if(!ed.options.autostart && ed.redactor){
					ed.stop();
				}
			},
			get_preset_properties: function() {
				var preset = this.model.get_property_value_by_name("preset"),
					props = PresetUtil.getPresetProperties('text', preset) || {};

				return props;
			},
			get_content_markup: function () {
				var content = this.model.get_content(),
					$content,
					data;

				// Fix tagless content causes WSOD
				try {
				  $content = $(content);
				} catch (error) {
					$content = $('<p>' + content + '</p>');
				}

				if($content.hasClass('plaintxt_padding')) {
					content = $content.html();
				}

				if (this.model.get_property_value_by_name('usingNewAppearance') !== true && this.model.get_property_value_by_name('usingNewAppearance') !== 'true') {
					data = {
						"content" : content,
						"background_color" : Upfront.Util.colors.convert_string_ufc_to_color(this.model.get_property_value_by_name("background_color")),
						"border" : Upfront.Util.colors.convert_string_ufc_to_color(this.model.get_property_value_by_name("border")),
						"usingNewAppearance": false
					};
				} else {
					data = {
						"content" : content,
						usingNewAppearance: true,
						"additional_padding" : this.get_preset_property('additional_padding'),
					};
				}
				var rendered = '';

				rendered = _.template(textTpl, data);
				return rendered;
			},
			is_edited: function () {
				var is_edited = this.model.get_property_value_by_name('is_edited');
				return is_edited ? true : false;
			},
			on_render: function() {
				var me = this,
				blurTimeout = false;

				this.$el.find('.upfront-object-content')
					// .addClass('upfront-plain_txt') // WHY DO THIS, IT MESSES UP THE CSS LOGIC SINCE THAN WE HAVE DUPLICATED CLASS
					.ueditor({
						linebreaks: false,
						//airButtons : ["upfrontFormatting"],
						autostart: false,
						paragraphize: false,
						focus: false,
						placeholder: l10n.default_content
					})
					.on('start', function(){
						var $swap = $(this).find('.upfront-quick-swap');
						if ( $swap.length ){
							$swap.remove();
						}
						me.model.set_property('is_edited', true, true);
						Upfront.Events.trigger('upfront:element:edit:start', 'text');
					})
					.on('stop', function(){
						var ed = me.$el.find('.upfront-object-content').data("ueditor"),
							tag = ed.redactor.$element[0].firstChild.tagName,
							text = '';

						if(tag === "PRE") {
							//Remove markers markup leaking in PRE element
							ed.redactor.selection.removeMarkers();
						}

						text = ed.getValue(true);

						if (text === '' && arguments[0] && arguments[0].currentTarget) text = arguments[0].currentTarget.innerHTML;
						me.model.set_content(text);

						Upfront.Events.trigger('upfront:element:edit:stop');
						ed.redactor.events.trigger('cleanUpListeners');
						me.render();
					})
					.on('syncAfter', function(){
						var ed = me.$el.find('.upfront-object-content').data("ueditor"),
							text = ed.getValue(true)
						;
						if (text === '' && typeof arguments[1] === 'string' && arguments[1] !== '') text = arguments[1];
						if (!text.match(/[<>]/)) {
							text = ed.redactor.paragraphize.load(text);
							ed.redactor.code.set(text);

							// Now, set the caret at the end
							ed.redactor.selection.selectAll();
							var blocks = ed.redactor.selection.getBlocks(),
								block = blocks.pop()
							;
							ed.redactor.selection.remove();
							if (block) {
								ed.redactor.caret.setAfter(block);
							}
							// done
						}

						me.model.set_content(ed.getValue(true) || text, {silent: true});
					})
				;

				me.update_colors();

				if (this.model.get_property_value_by_name('preset')) {
          // for some unknown reason there are two versions of text rendering, so cover both just in case
					this.$el.find('.upfront-output-plaintxt').addClass(this.model.get_property_value_by_name('preset'));
					this.$el.find('.upfront-output-plain_text').addClass(this.model.get_property_value_by_name('preset'));
				}
			},
			get_preset_property: function(prop_name) {
				var preset = this.model.get_property_value_by_name("preset"),
					props = PresetUtil.getPresetProperties('text', preset) || {};

				return props[prop_name];
			},
			update_colors: function () {
				var me = this;

				var bg = me.model.get_property_value_by_name("background_color");
				if (bg && Upfront.Util.colors.is_theme_color(bg)) {
					bg = Upfront.Util.colors.get_color(bg);

					me.model.set_property("bg_color", bg);
				}

				var border = me.model.get_property_value_by_name("border"),
					matches = border ? border.match(/#ufc\d+/) : false
				;
				if (border && matches && matches.length) {
					var color = Upfront.Util.colors.get_color(matches[0]);
					border = border.replace(new RegExp(matches[0]), color);

					me.model.set_property("border_color", color);
				}

			}
		});

		Upfront.Application.LayoutEditor.add_object("PlainTxt", {
			"Model": UtextModel,
			"View": TextView,
			"Element": TextElement,
			"Settings": TextSettings,
			"ContextMenu": TextMenu,
			cssSelectors: {
				'.plain-text-container': {label: l10n.css.container_label, info: l10n.css.container_info},
				'.plain-text-container p': {label: l10n.css.p_label, info: l10n.css.p_info},
			},
			cssSelectorsId: 'PlainTxtModel'
		});

		Upfront.Models.UtextModel = UtextModel;
		Upfront.Views.PlainTxtView = TextView;

	});
})(jQuery);
