(function ($) {
define([
	'text!upfront/templates/popup.html'
], function(popupTemplate) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var PresetCSSEditor = Backbone.View.extend({
		className: 'upfront-ui',
		id: 'upfront-csseditor',
		tpl: _.template($(popupTemplate).find('#csseditor-tpl').html()),
		prepareAce: false,
		ace: false,
		events: {
			'click .upfront-css-save-ok': 'save',
			'click .upfront-css-close': 'close',
			'click .upfront-css-theme_image': 'openThemeImagePicker',
			'click .upfront-css-media_image': 'openImagePicker',
			'click .upfront-css-font': 'startInsertFontWidget',
			'click .upfront-css-selector': 'addSelector',
			'click .upfront-css-type' : 'scrollToElement',
			'mouseenter .upfront-css-selector': 'hiliteElement',
			'mouseleave .upfront-css-selector': 'unhiliteElement',
		},
		//elemenTypes' element id matches model's 'id_slug' attribute
		elementTypes: {
			UaccordionModel: {label: l10n.accordion, id: 'accordion'},
			UcommentModel: {label: l10n.comments, id: 'comment'},
			UcontactModel: {label: l10n.contact_form, id: 'contact'},
			UgalleryModel: {label: l10n.gallery, id: 'gallery'},
			UimageModel: {label: l10n.image, id: 'image'},
			LoginModel: {label: l10n.login, id: 'upfront-login_element'},
			LikeBox: {label: l10n.like_box, id: 'Like-box-object'},
			MapModel: {label: l10n.map, id: 'upfront-map_element'},
			UnewnavigationModel: {label: l10n.navigation, id: 'newnavigation'},
			ButtonModel: {label: l10n.button, id: 'button'},
			//UpostsModel: {label: l10n.posts, id: 'uposts'},
			PostsModel: {label: l10n.posts, id: 'posts'},
			UsearchModel: {label: l10n.search, id: 'search'},
			USliderModel: {label: l10n.slider, id: 'slider'},
			SocialMediaModel: {label: l10n.social, id: 'SocialMedia'},
			UtabsModel: {label: l10n.tabs, id: 'tabs'},
			ThisPageModel: {label: l10n.page, id: 'this_page'},
			ThisPostModel: {label: l10n.post, id: 'this_post'},
			UwidgetModel: {label: l10n.widget, id: 'widget'},
			UyoutubeModel: {label: l10n.youtube, id: 'youtube'},
			PlainTxtModel: {label: l10n.text, id:'plain_text'},
		},
		initialize: function(options) {
			var me = this,
				deferred = $.Deferred(),
				style_selector,
				$style;

			this.options = options || {};
			this.model = options.model;
			this.sidebar = ( options.sidebar !== false );
			this.global = ( options.global === true );

			this.prepareAce = deferred.promise();
			require(['//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js'], function(){
				deferred.resolve();
			});

			this.resizeHandler = this.resizeHandler || function(){
				me.$el.width($(window).width() - $('#sidebar-ui').width() -1);
			};

			$(window).on('resize', this.resizeHandler);

			style_selector = this.model.get('id') + '-breakpoint-style';
			$style = $('#' + style_selector);
			if ($style.length === 0) {
				this.$style = $('<style id="' + style_selector + '"></style>');
				$('body').append(this.$style);
			} else {
				this.$style = $style
			}
			
			this.createSelectors(Upfront.Application.LayoutEditor.Objects);
			
			this.modelType = this.options.model.get_property_value_by_name('type');
			this.elementType = this.elementTypes[this.modelType] || {label: 'Unknown', id: 'unknown'};
			
			this.selectors = this.elementSelectors[this.modelType] || {};

			if ( typeof options.change == 'function' ) this.listenTo(this, 'change', options.change);

			this.render();

			this.startResizable();
		},
		close: function(event) {
			if(event)
				event.preventDefault();

			$(window).off('resize', this.resizeHandler);

			if(this.editor)
				this.editor.destroy();

			$('#page').css('padding-bottom', 0);
			this.remove();
		},
		render: function() {
			var me = this;

			$('#page').append(this.$el);

			if (!this.sidebar)
				this.$el.addClass('upfront-css-no-sidebar');
			else
				this.$el.removeClass('upfront-css-no-sidebar');

			this.$el.html(this.tpl({
				name: this.stylename,
				elementType: this.elementType.label,
				selectors: this.selectors,
				show_style_name: false
			}));

			this.resizeHandler('.');

			var bodyHeight = this.$el.height() - this.$('.upfront-css-top').outerHeight();
			this.$('.upfront-css-body').height(bodyHeight);

			this.prepareAce.done(function(){
				me.startAce();
			});

			this.prepareSpectrum();

			this.$el.show();
		},
		startAce: function() {
			var me = this,
				editor = ace.edit(this.$('.upfront-css-ace')[0]),
				session = editor.getSession()
			;

			session.setUseWorker(false);
			editor.setShowPrintMargin(false);

			session.setMode("ace/mode/css");
			editor.setTheme('ace/theme/monokai');

			editor.on('change', function(event){
				var styles_with_selector;
				var rules = editor.getValue().split('}'),
					separator = '\n\n.' + me.options.page_class + ' ';

				rules = _.map(rules, function(rule){return $.trim(rule);});
				rules.pop();

				styles_with_selector = separator + rules.join('\n}' + separator) + '\n}';

				me.$style.html(styles_with_selector);
				me.trigger('change', styles_with_selector);
			});
			

			var styles = this.options.preset.get('preset_style') ? this.options.preset.get('preset_style') : '';
			
			scope = new RegExp(this.get_css_selector() + '\\s*', 'g');
			styles = styles.replace(scope, '');
			
			styles = Upfront.Util.colors.convert_string_color_to_ufc(styles);
			editor.setValue($.trim(styles), -1);

			// Set up the proper vscroller width to go along with new change.
			editor.renderer.scrollBar.width = 5;
			editor.renderer.scroller.style.right = "5px";

			editor.focus();
			this.editor = editor;
		},
		prepareSpectrum: function(){
			var me = this,
				color_picker = new Upfront.Views.Editor.Field.Color({
					default_value: '#ffffff',
					showAlpha: true,
					showPalette: true,
					maxSelectionSize: 9,
					localStorageKey: "spectrum.recent_bgs",
					preferredFormat: "hex",
					chooseText: "Ok",
					showInput: true,
					allowEmpty:true,
					autohide: false,
					spectrum: {
						show: function(){
							//spectrum = $('.sp-container:visible');
						},
						choose: function(color) {
							var colorString = color.alpha < 1 ? color.toRgbString() : color.toHexString();
							me.editor.insert(colorString);
							me.editor.focus();
						}
					}
				})
			;
			color_picker.render();
			me.$('.upfront-css-color').html(color_picker.el);
		},
		createSelectors: function(objects){
			var me = this,
				selectors = {}
			;

			_.each(objects, function(object){
				selectors[object.cssSelectorsId] = object.cssSelectors || {};
			});
			me.elementSelectors = selectors;
		},

		createSelector: function(model_class, view_class, id) {
			var model = new model_class(),
				view = new view_class({model: model});
			this.elementSelectors[id] = view.cssSelectors || {};
			view.remove();
		},
		startResizable: function() {
			// Save the fetching inside the resize
			var me = this,
				$cssbody = me.$('.upfront-css-body'),
				topHeight = me.$('.upfront-css-top').outerHeight(),
				$selectors = me.$('.upfront-css-selectors'),
				$saveform = me.$('.upfront-css-save-form'),
				onResize = function(e, ui){
					var height = ui ? ui.size.height : me.$('.upfront-css-resizable').height(),
						bodyHeight = height  - topHeight;
					$cssbody.height(bodyHeight);
					if(me.editor)
						me.editor.resize();
					$selectors.height(bodyHeight - $saveform.outerHeight());
					$('#page').css('padding-bottom', height);
				}
			;
			onResize();
			this.$('.upfront-css-resizable').resizable({
				handles: {n: '.upfront-css-top'},
				resize: onResize,
				minHeight: 200,
				delay: 100
			});
		},
		remove: function() {
			Backbone.View.prototype.remove.call(this);
			$(window).off('resize', this.resizeHandler);
		},
		openThemeImagePicker: function () {
			this._open_media_popup({themeImages: true});
		},

		openImagePicker: function(){
			this._open_media_popup();
		},

		/**
		 * Handles media popups.
		 * In this context, used for both theme and media images list.
		 *
		 * @param object opts Boot-time options to be passed to Upfront.Media.Manager
		 */
		_open_media_popup: function (opts) {
			opts = _.isObject(opts) ? opts : {};
			var me = this,
				options = _.extend({}, opts)
			;

			Upfront.Media.Manager.open(options).done(function(popup, result){
				Upfront.Events.trigger('upfront:element:edit:stop');
				if (!result) return;

				var imageModel = result.models[0],
					img = imageModel.get('image') ? imageModel.get('image') : result.models[0],
					url = 'src' in img ? img.src : ('get' in img ? img.get('original_url') : false)
				;

				me.editor.insert('url("' + url + '")');
				me.editor.focus();
			});
		},
		startInsertFontWidget: function() {
			var insertFontWidget = new Upfront.Views.Editor.Insert_Font_Widget({ collection: Upfront.Views.Editor.Fonts.theme_fonts_collection });
			$('#insert-font-widget').html(insertFontWidget.render().el);
		},
		scrollToElement: function(){
			var $element = $('#' + this.element_id);
			if(!$element.length)
				return;

			var offset = $element.offset().top - 50;
			$(document).scrollTop(offset > 0 ? offset : 0);

			this.blink($element, 4);
		},
		hiliteElement: function(e){
			var selector = $(e.target).data('selector');
			if(!selector.length)
				return;
			var element = $('#' + this.element_id);
			element.find(selector).addClass('upfront-css-hilite');
		},

		unhiliteElement: function(e){
			var selector = $(e.target).data('selector');
			if(!selector.length)
				return;
			var element = $('#' + this.element_id);
			element.find(selector).removeClass('upfront-css-hilite');
		},
		addSelector: function(e) {
			var selector = $(e.target).data('selector');
			this.editor.insert(selector);
			this.editor.focus();
		},
		get_css_selector: function() {
			if (this.is_global_stylesheet) return '';
			return '.' + this.elementType.id + '-preset-' + this.options.preset.get('id');
		},
		updateStyles: function(contents){
			var $el = this.get_style_element();
			Upfront.Util.Transient.push('css-' + this.element_id, $el.html());
			contents = Upfront.Util.colors.convert_string_ufc_to_color( contents);
			$el.html(
				this.stylesAddSelector(
					contents, (this.is_default_style ? '' : this.get_css_selector())
				)
			);
			this.trigger('updateStyles', this.element_id);
		},

		stylesAddSelector: function(contents, selector) {
			if (this.is_global_stylesheet && empty(selector)) return contents;
			var me = this,
				rules = contents.split('}'),
				processed = ''
			;
			_.each(rules, function (rl) {
				var src = $.trim(rl).split('{');
				if (src.length != 2) return true; // wtf
				var individual_selectors = src[0].split(','),
					processed_selectors = []
				;
				_.each(individual_selectors, function (sel) {
					sel = $.trim(sel);
					var clean_selector = sel.replace(/:[^\s]+/, ''); // Clean up states states such as :hover, so as to not mess up the matching
					var	is_container = clean_selector[0] === '@' || me.recursiveExistence(selector, clean_selector),
						spacer = is_container
							? '' // This is not a descentent selector - used for containers
							: ' ' // This is a descentent selector
					;

					processed_selectors.push('' +
						selector + spacer + sel +
					'');
				});
				processed += processed_selectors.join(', ') + ' {' +
					src[1] + // Actual rule
				'\n}\n';
			});
			return processed;
		/*
			var rules = contents.split('}'),
				separator = '\n\n' + selector + ' ';


			rules = _.map(rules, function(rule){return $.trim(rule);});

			rules.pop();

			return separator + rules.join('\n}' + separator) + '\n}';
		*/
		},
		recursiveExistence: function(selector, clean_selector) {
			var splitted = clean_selector.split(' ');
			var me = this;
			while(splitted.length > 0) {
				try{
					if(!!$(selector + splitted.join(' ')).closest('#' + me.element_id).length)
						return true;
				}
				catch (err) {

				}
				splitted.pop();
			}

			return false;
		},
		save: function(event) {
			if (event) event.preventDefault();
			var me = this,
				styles = $.trim(this.editor.getValue()),
				data;

			if (this.is_global_stylesheet === false && this.stylename === this.get_temp_stylename())
				return Upfront.Views.Editor.notify(l10n.style_name_nag, 'error');

			if(!styles)
				return Upfront.Views.Editor.notify(l10n.style_empty_nag, 'error');

			styles = this.stylesAddSelector(styles, (this.is_default_style ? '' : this.get_css_selector()));
			data = {
				styles: styles,
				elementType: this.elementType.id,
				global: this.global
			};
			
			// If in exporter mode, export instead of saving
			if (Upfront.Application.is_builder()) {
				data.stylename = this.get_style_id();
				if (this.is_global_stylesheet) {
					var props = Upfront.Application.current_subapplication.layout.get('properties'),
						layout_styles = props && props.findWhere ? props.findWhere({name: 'layout_style'}) : false
					;
					if (layout_styles && layout_styles.set) layout_styles.set({'value': styles});
					else {
						props.add({name: "layout_style", value: styles});
					}
				}
				Upfront.Behaviors.LayoutEditor.export_element_styles(data);
				return;
			}
			
			this.options.preset.set('preset_style', data.styles);
			
			this.trigger('upfront:presets:update', this.options.preset.toJSON());

		},
	});
	
	return PresetCSSEditor;
});
})(jQuery);
