(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;
	define([
		"text!upfront/templates/popup.html",
		'scripts/upfront/upfront-views-editor/fields',
		'scripts/upfront/upfront-views-editor/fonts',
		'scripts/upfront/upfront-views-editor/notifier',
		'scripts/perfect-scrollbar/perfect-scrollbar'
	], function (popup_tpl, Fields, Fonts, notifier, perfectScrollbar) {
		return Backbone.View.extend({
			className: 'upfront-ui',
			id: 'upfront-csseditor',
			tpl: _.template($(popup_tpl).find('#csseditor-tpl').html()),
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
				'click .upfront-css-delete': 'deleteStyle',
				'change .upfront-css-save-name-field': 'updateStylename',
				'mouseenter .upfront-css-selector': 'hiliteElement',
				'mouseleave .upfront-css-selector': 'unhiliteElement',
				'keyup .upfront-css-save-name-field': 'checkDeleteToggle'
			},

			//elemenTypes' element id matches model's 'id_slug' attribute
			elementTypes: {
				UaccordionModel: {label: l10n.accordion, id: 'uaccordion'},
				UcommentModel: {label: l10n.comments, id: 'ucomment'},
				UcontactModel: {label: l10n.contact_form, id: 'ucontact'},
				UgalleryModel: {label: l10n.gallery, id: 'ugallery'},
				UimageModel: {label: l10n.image, id: 'image'},
				LoginModel: {label: l10n.login, id: 'upfront-login_element'},
				LikeBox: {label: l10n.like_box, id: 'Like-box-object'},
				MapModel: {label: l10n.map, id: 'upfront-map_element'},
				UnewnavigationModel: {label: l10n.navigation, id: 'unewnavigation'},
				ButtonModel: {label: l10n.button, id: 'ubutton'},
				//UpostsModel: {label: l10n.posts, id: 'uposts'},
				PostsModel: {label: l10n.posts, id: 'uposts'},
				UsearchModel: {label: l10n.search, id: 'usearch'},
				USliderModel: {label: l10n.slider, id: 'uslider'},
				SocialMediaModel: {label: l10n.social, id: 'SocialMedia'},
				UtabsModel: {label: l10n.tabs, id: 'utabs'},
				ThisPageModel: {label: l10n.page, id: 'this_page'},
				ThisPostModel: {label: l10n.post, id: 'this_post'},
				UwidgetModel: {label: l10n.widget, id: 'uwidget'},
				UyoutubeModel: {label: l10n.youtube, id: 'uyoutube'},
				PlainTxtModel: {label: l10n.text, id:'plain_text'},
				CodeModel: {label: l10n.code, id: 'upfront-code_element'},
				Layout: {label: l10n.body, id: 'layout'},
				GalleryLightbox: {label: l10n.body, id: 'gallery-lightbox'},
				RegionContainer: {label: l10n.region, id: 'region-container'},
				Region: {label: l10n.inner_region, id: 'region'},
				RegionLightbox: {label: l10n.ltbox_region, id: 'region'},
				ModuleGroup: {label: l10n.group, id: 'module-group'},
				PostPart_titleModel: {label: l10n.postpart_title, id: 'PostPart_title'},
				PostPart_contentsModel: {label: l10n.postpart_content, id: 'PostPart_contents'},
				PostPart_excerptModel: {label: l10n.postpart_excerpt, id: 'PostPart_excerpt'},
				PostPart_featured_imageModel: {label: l10n.postpart_featured, id: 'PostPart_featured_image'},
				PostPart_authorModel: {label: l10n.postpart_author, id: 'PostPart_author'},
				PostPart_author_gravatarModel: {label: l10n.postpart_author_gravatar, id: 'PostPart_author_gravatar'},
				PostPart_dateModel: {label: l10n.postpart_date, id: 'PostPart_date'},
				PostPart_updateModel: {label: l10n.postpart_update, id: 'PostPart_update'},
				PostPart_comments_countModel: {label: l10n.postpart_comments, id: 'PostPart_comments_count'},
				PostPart_tagsModel: {label: l10n.postpart_tags, id: 'PostPart_tags'},
				PostPart_categoriesModel: {label: l10n.postpart_categories, id: 'PostPart_categories'}
			},
			initialize: function() {
				if (!$('#' + this.id).length) $('body').append(this.el);
				Upfront.Events.on("command:region:edit_toggle", this.close, this);
				Upfront.plugins.call('insert-css-editor-types', {types: this.elementTypes});
			},
			init: function(options) {
				var me = this,
					deferred = $.Deferred(),
					modelType;

				if (this.$style) this.close();

				// Don't render the editor, only makes the API available
				this.no_render = ( options.no_render === true );
				this.no_stylename_fallback = ( options.no_stylename_fallback === true );

				this.model = options.model;
				this.sidebar = ( options.sidebar !== false );
				this.toolbar = ( options.toolbar !== false );
				this.readOnly = ( options.readOnly === true );
				this.global = ( options.global === true );

				this.modelType = options.type ? options.type : this.model.get_property_value_by_name('type');
				this.elementType = this.elementTypes[this.modelType] || {label: 'Unknown', id: 'unknown'};

				// CSS editor treats global stylesheet as a separate case. When options.type is "Layout"
				// and options.element_id is "layout" than global stylesheet is edited.
				this.is_global_stylesheet = options.type === 'Layout' && options.element_id === 'layout';

				if (this.is_global_stylesheet) this.sidebar = true;

				this.resolve_stylename(options);

				this.ensure_style_element();

				this.selectors = this.elementSelectors[this.modelType] || {};

				this.element_id = options.element_id ? options.element_id : this.model.get_property_value_by_name('element_id');

				if ( !this.no_render ) {
					this.prepareAce = deferred.promise();
					upfrontrjs = window.upfrontrjs || {
						define: define,
						require: require,
						requirejs: requirejs
					};
					upfrontrjs.require([Upfront.Settings.ace_url], function() {
						deferred.resolve();
					});

					this.resizeHandler = this.resizeHandler || function(){
							// If small screen, avoid gap between sidebar.
							if (window.innerWidth < 1366) {
								me.$el.width($(window).width() - 130);
							} else {
								// Otherwise, fill screen except sidebar width.
								me.$el.width($(window).width() - $('#sidebar-ui').width() -1);
							}
						};

					$(window).on('resize', this.resizeHandler);

					if ( typeof options.change == 'function' ) this.on('change', options.change);

					this.render();

					Upfront.Events.on("command:undo", function () {
						setTimeout(function () {
							var styles = Upfront.Util.Transient.pop('css-' + me.element_id);
							if (styles) {
								me.get_style_element().html(styles.replace(/#page/g, 'div#page.upfront-layout-view .upfront-editable_entity.upfront-module'));
								me.render();
							}
						}, 200);
					});

					this.startResizable();

					Upfront.Events.trigger('csseditor:open', this.element_id);
				}
			},
			resolve_stylename: function(options) {
				// Style name will be used to identify style element inserted to page by id and
				// to add class to elements that are using this style.
				this.stylename = ''; // reset
				if (this.is_global_stylesheet) this.stylename = 'layout-style';
				else this.stylename = options.stylename;

				// Check for regions
				if (this.is_region_style()) {
					var layout_id = _upfront_post_data.layout.specificity || _upfront_post_data.layout.item || _upfront_post_data.layout.type,
						is_global = ( this.model.get('scope') == 'global' ),
						default_stylename = this.elementType.id + '-' + this.model.get('name') + '-style',
						layout_stylename = layout_id + '-' + this.model.get('name') + '-style';
					if (is_global){
						this.stylename = default_stylename;
					} else {
						this.stylename = layout_stylename;
						if (
							_.isArray(Upfront.data.styles[this.elementType.id])
							&& Upfront.data.styles[this.elementType.id].indexOf(default_stylename) !== -1
							&& Upfront.data.styles[this.elementType.id].indexOf(layout_stylename) === -1
							&& !this.no_stylename_fallback
						) {
							this.stylename = default_stylename;
						}
					}
				}


				// If stylename is still empty than editor is creating new style and user have not
				// yet assigned name to style. Create temporary style name.
				if (this.stylename === '') {
					// User is adding element style so assign name according to element type
					// and add class to element on which editor is started so changes to style
					// reflect as edited.
					this.stylename = this.get_temp_stylename();
					$('#' + this.model.get_property_value_by_name('element_id')).addClass(this.stylename);
				}

				// For default styles saving and loading process is a bit different hence this flag
				this.is_default_style = this.stylename === '_default';
			},
			is_region_style: function() {
				return this.elementType.id === 'region-container'
					|| this.elementType.id === 'region';
			},
			get_style_id: function() {
				// Prepend element type if this is default style
				return this.is_default_style ?
					this.elementType.id + '_default' : this.stylename;
			},
			get_css_selector: function() {
				var pluginsCallResult = Upfront.plugins.call('get-css-editor-selector', {object: this});
				if (pluginsCallResult.status && pluginsCallResult.status === 'called' && pluginsCallResult.result) {
					return pluginsCallResult.result;
				}

				if (this.is_global_stylesheet) return '';

				if (this.is_region_style()) return '.upfront-' + this.elementType.id + '-' + this.model.get('name');

				// Add some specificity so this style would go over other
				if (this.is_default_style === false) return '#page .' + this.stylename;

				return '.upfront-output-' + this.elementType.id;
			},
			ensure_style_element: function() {
				var $style_el = this.get_style_element();
				if($style_el.length !== 0) {
					this.$style = $style_el;
					return;
				}

				this.$style = $('<style id="' + this.get_style_id() + '"></style>');
				$('body').append(this.$style);
			},
			get_style_element: function() {
				return $('style#' + this.get_style_id());
			},
			close: function(e){
				if(e && _.isFunction(e.preventDefault)) e.preventDefault();

				$(window).off('resize', this.resizeHandler);
				this.off('change');

				this.$style = false;
				if (this.editor) this.editor.destroy();

				$('#page').css('padding-bottom', 0);
				this.$el.hide();

				Upfront.Events.trigger('csseditor:closed', this.element_id);
			},
			render: function(){
				var me = this;

				if (!$('#' + this.id).length) $('#page').append(this.$el);

				if (!this.sidebar) {
					this.$el.addClass('upfront-css-no-sidebar');
				} else {
					this.$el.removeClass('upfront-css-no-sidebar');
				}

				this.$el.html(this.tpl({
					name: this.stylename,
					elementType: this.elementType.label,
					selectors: this.selectors,
					show_style_name: this.is_region_style() === false && this.is_global_stylesheet === false && this.sidebar !== true,
					showToolbar: this.toolbar
				}));

				this.resizeHandler('.');

				var bodyHeight = this.$el.height() - this.$('.upfront-css-top').outerHeight();
				this.$('.upfront-css-body').height(bodyHeight);

				this.prepareAce.done(function(){
					me.startAce();
				});

				this.prepareSpectrum();

				this.checkDeleteToggle(this.stylename);

				this.$el.show();
			},
			startAce: function() {
				var me = this,
					editor = ace.edit(this.$('.upfront-css-ace')[0]),
					session = editor.getSession(),
					scrollerDisplayed = false,
					selector,
					scope,
					styles
				;

				session.setUseWorker(false);
				editor.setShowPrintMargin(false);

				editor.setReadOnly(this.readOnly);

				session.setMode("ace/mode/css");
				editor.setTheme('ace/theme/monokai');

				editor.on('change', function(e){
					if (me.timer) clearTimeout(me.timer);
					me.timer = setTimeout(function(){
						me.updateStyles(editor.getValue());
					},800);
					me.trigger('change', editor);

					if(typeof me.editor !== "undefined") {
						var aceOuterWidth = $(me.editor.container).get(0).scrollWidth;
						var aceInnerWidth = $(me.editor.container).find('.ace_content').innerWidth();

						if(aceOuterWidth < aceInnerWidth + 40) {
							if(!scrollerDisplayed) {
								me.startResizable();
							}
							scrollerDisplayed = true;
						} else {
							scrollerDisplayed = false;
						}
					}
				});

				styles = Upfront.Util.colors.convert_string_color_to_ufc(this.get_style_element().html().replace(/div#page.upfront-layout-view .upfront-editable_entity.upfront-module/g, '#page'));
				if (this.is_global_stylesheet === false) {
					selector = this.get_css_selector().replace(/[.+*\[\]]/g, '\\$&');
					scope = new RegExp(selector + '\\s*', 'g');
					styles = styles.replace(scope, '');
				}
				editor.setValue($.trim(styles), -1);

				// Set up the proper vscroller width to go along with new change.
				editor.renderer.scrollBar.width = 5;
				editor.renderer.scroller.style.right = "5px";

				// Add JS Scrollbar.
				perfectScrollbar.withDebounceUpdate(
					// Element.
					this.$el.find('.ace_scrollbar')[0],
					// Run First.
					false,
					// Event.
					false,
					// Initialize.
					true
				);

				editor.focus();
				this.editor = editor;

				if(me.timer) clearTimeout(me.timer);
				me.timer = setTimeout(function(){
					me.startResizable();
				},300);

			},
			prepareSpectrum: function(){
				var me = this,
					color_change = function (color) {
						var colorString;
						if( color.get_is_theme_color() !== false ){
							colorString = color.theme_color;
						}else{
							colorString = color.alpha < 1 ? color.toRgbString() : color.toHexString();
						}
						me.editor.insert(colorString);
						me.editor.focus();
					},
					color_picker = new Fields.Color({
						default_value: '#ffffff',
						showAlpha: true,
						showPalette: true,
						maxSelectionSize: 9,
						localStorageKey: "spectrum.recent_bgs",
						preferredFormat: "hex",
						chooseText: Upfront.Settings.l10n.global.content.ok,
						showInput: true,
						allowEmpty:true,
						autohide: false,
						spectrum: {
							show: function(){
								//spectrum = $('.sp-container:visible');
							},
							choose: color_change
						}
					})
				;
				color_picker.render();
				me.$('.upfront-css-color').html(color_picker.el);
			},
			startResizable: function(){
				// Save the fetching inside the resize
				var me = this,
					$cssbody = me.$('.upfront-css-body'),
					topHeight = 0,
					$selectors = me.$('.upfront-css-selectors'),
					$saveform = me.$('.upfront-css-save-form'),
					$rsz = this.$('.upfront-css-resizable'),
					onResize = function(e, ui){
						var height = ui ? ui.size.height : me.$('.upfront-css-resizable').height(),
							bodyHeight = height  - topHeight;
						$cssbody.height(bodyHeight);
						if(me.editor)
							me.editor.resize();
						$selectors.outerHeight(bodyHeight - $saveform.outerHeight());
						// Clean unneeded CSS
						$rsz.css({
							width: "",
							height: "",
							left: "",
							top: ""
						});
						$('#page').css('padding-bottom', height);
					}
				;
				// Add appropriate handle classes
				$rsz.find(".upfront-css-top")
					.removeClass("ui-resizable-handle").addClass("ui-resizable-handle")
					.removeClass("ui-resizable-n").addClass("ui-resizable-n")
				;
				topHeight = me.$('.upfront-css-top').outerHeight();
				onResize();
				$rsz.resizable({
					handles: {n: '.upfront-css-top'},
					resize: onResize,
					minHeight: 200,
					delay: 100
				});
			},
			scrollToElement: function(){
				var $element = $('#' + this.element_id);

				if(!$element.length) return;

				var offset = $element.offset().top - 50;
				$(document).scrollTop(offset > 0 ? offset : 0);

				this.blink($element, 4);
			},

			blink: function(element, times) {
				var me = this;
				element.css('outline', '3px solid #3ea');
				setTimeout(function(){
					element.css('outline', 'none');

					times--;
					if (times > 0) {
						setTimeout(function(){
							me.blink(element, times - 1);
						}, 100);
					}

				}, 100);
			},

			hiliteElement: function(e){
				var selector = $(e.target).data('selector');

				if (!selector.length) return;

				var element = this.is_region_style() === false ? $('#' + this.element_id).parent() : $('#' + this.element_id);
				element.find(selector).addClass('upfront-css-hilite');
			},

			unhiliteElement: function(e){
				var selector = $(e.target).data('selector');

				if(!selector.length) return;

				var element = this.is_region_style() === false ? $('#' + this.element_id).parent() : $('#' + this.element_id);
				element.find(selector).removeClass('upfront-css-hilite');
			},

			remove: function(){
				Backbone.View.prototype.remove.call(this);
				$(window).off('resize', this.resizeHandler);
			},

			updateStyles: function(contents){
				var $el = this.get_style_element();
				Upfront.Util.Transient.push('css-' + this.element_id, $el.html());
				contents = Upfront.Util.colors.convert_string_ufc_to_color( contents);
				$el.html(
					this.stylesAddSelector(
						contents, (this.is_default_style ? '' : this.get_css_selector())
					).replace(/#page/g, 'div#page.upfront-layout-view .upfront-editable_entity.upfront-module')
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

				// Handle closing comments being omitted from the processed string
				// Only apply if the original contents has closing CSS comment, and the processed one does not
				if (contents.match(/\*\/\s*$/) && !processed.match(/\*\/\s*$/)) {
					processed += '\n*/';
				}

				return processed;
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
			// When stylename changes upfront needs to update element model theme_style property
			// and also to save style under new stylename.
			updateStylename: function() {
				var new_name =  $.trim(this.$('.upfront-css-save-name-field').val()),
					old_name = this.stylename;

				// Strict filtering on stylename
				new_name = new_name.replace(/\s/g, '-').replace(/[^A-Za-z0-9_-]/gi, '').replace(/-+/g, '-').toLowerCase();

				if (old_name === '_default') {
					this.$('.upfront-css-save-name-field').val('_default');
					Upfront.Views.Editor.notify(l10n.default_style_name_nag, 'error');
					return;
				}

				// Update class on element on which editor was called
				$('#' + this.model.get_property_value_by_name('element_id')).removeClass(this.stylename);
				$('#' + this.model.get_property_value_by_name('element_id')).addClass(new_name);

				// Replace id on style element
				this.get_style_element().attr('id', new_name);
				this.stylename = new_name;

				// Replace selector in style element htnl
				this.get_style_element().html(
					this.get_style_element().html().replace(new RegExp(old_name, 'g'), new_name)
				);

				// Update element on which editor is called to have appropriate theme style
				this.model.set_breakpoint_property('theme_style', new_name);

				// If this is change of name from temp don't do anything
				if (old_name === this.get_temp_stylename) return;

				// TODO Delete old style from database/files
				// this.delete(undefined, true);
				// Need to save with new name and delete old name
				this.save();
			},

			get_temp_stylename: function() {
				return this.modelType.toLowerCase().replace('model', '') + '-new-style';
			},

			save: function(event) {
				if (event) event.preventDefault();
				var me = this,
					styles = $.trim(this.editor.getValue()),
					data;

				if (this.is_global_stylesheet === false && this.stylename === this.get_temp_stylename())
					return notifier.addMessage(l10n.style_name_nag, 'error');

				styles = this.stylesAddSelector(styles, (this.is_default_style ? '' : this.get_css_selector()));
				data = {
					styles: styles,
					elementType: this.elementType.id,
					global: this.global
				};

				var pluginsCallResult = Upfront.plugins.call('css-editor-save-style', {
					data: data,
					stylename: this.get_style_id(),
					isGlobalStylesheet: this.is_global_stylesheet,
					styles: styles
				});

				if (pluginsCallResult.status && pluginsCallResult.status === 'called') {
					return;
				}

				data.name = this.get_style_id();
				data.action = 'upfront_save_styles';

				Upfront.Util.post(data)
					.success(function(response) {
						var data = response.data,
							elementType = me.elementType.id;

						if (!Upfront.data.styles[elementType]) {
							Upfront.data.styles[elementType] = [];
						}

						if (Upfront.data.styles[elementType].indexOf(me.get_style_id()) === -1) {
							Upfront.data.styles[elementType].push(me.get_style_id());
						}

						Upfront.Events.trigger('upfront:themestyle:saved', me.get_style_id());

						me.checkDeleteToggle(data.name);

						return notifier.addMessage(l10n.style_saved_as.replace(/%s/,  me.get_style_id()));
					})
					.error(function(response){
						return notifier.addMessage(l10n.there_was_an_error);
					});
			},

			/* API to call save style without loading editor */
			saveCall: function (notify) {
				var me = this,
					styles = $.trim(this.get_style_element().html()),
					data;

				data = {
					styles: styles,
					elementType: this.elementType.id,
					global: this.global
				};
				var pluginsCallResult = Upfront.plugins.call('css-editor-headless-save-style', {
					data: data,
					stylename: this.get_style_id()
				});

				if (pluginsCallResult.status && pluginsCallResult.status === 'called') {
					return;
				}

				data.name = this.get_style_id();
				data.action = 'upfront_save_styles';

				Upfront.Util.post(data)
					.success(function(response) {
						var data = response.data,
							elementType = me.elementType.id;

						if (!Upfront.data.styles[elementType]) Upfront.data.styles[elementType] = [];

						if (Upfront.data.styles[elementType].indexOf(me.get_style_id()) === -1) {
							Upfront.data.styles[elementType].push(me.get_style_id());
						}

						Upfront.Events.trigger('upfront:themestyle:saved', me.get_style_id());

						return notify ? notifier.addMessage(l10n.style_saved_as.replace(/%s/,  me.get_style_id())) : true;
					})
					.error(function(response){
						return notify ? notifier.addMessage(l10n.there_was_an_error) : true;
					});

			},

			checkDeleteToggle: function(e){
				if (_.isUndefined(e)) return;

				if(!this.deleteToggle) {
					this.deleteToggle = $('<a href="#" class="upfront-css-delete">' + l10n.delete_style + '</a>');
				}

				var value = _.isString(e) ? e : e.target.value,
					elementType = this.elementType.id,
					styles = Upfront.data.styles[elementType],
					showdelete = styles && styles.indexOf(elementType + '-' + value) != -1,
					inDom = this.deleteToggle.parent().length
				;

				if(showdelete && !inDom) {
					this.$('.upfront-css-save-form').append(this.deleteToggle);
				} else if(!showdelete && inDom) {
					this.deleteToggle.detach();
				}
			},

			deleteStyle: function(e){
				e.preventDefault();
				var me = this,
					elementType = this.elementType.id,
					styleName = elementType + '-' + this.$('.upfront-css-save-name-field').val()
				;

				if(!confirm(l10n.delete_stylename_nag.replace(/%s/, styleName)))
					return;

				var deleteData = {
					elementType: elementType,
					styleName: styleName,
					action: 'upfront_delete_styles'
				};

				Upfront.Util.post(deleteData)
					.done(function(){
						var styleIndex = Upfront.data.styles[elementType].indexOf(styleName);
						notifier.addMessage(l10n.stylename_deleted.replace(/%s/, styleName));

						//Clean the editor up
						me.$('.upfront-css-save-name-field').val('');
						me.editor.setValue('');

						//Remove the styles from the available styles
						if(styleIndex != -1)
							Upfront.data.styles[elementType].splice(styleIndex, 1);

						//Remove the styles from the dom
						$('#upfront-style-' + styleName).remove();

						//Unset the styles of the element if they are the same as the deleted ones.
						if(me.model.get_property_value_by_name('theme_style') == styleName)
							me.model.set_property('theme_style', '');

						//Remove the delete link
						me.deleteToggle.detach();
					})
				;
			},

			/* Used by upfront application */
			fetchThemeStyles: function(separately){
				var fetchData = {
						action:'upfront_theme_styles',
						separately: separately
					},
					deferred = $.Deferred()
				;

				Upfront.Util.post(fetchData)
					.success(function(response){
						deferred.resolve(response.data.styles);
					});
				return deferred.promise();
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
					if ( 0 === result.length ) return;

					var imageModel = result.models[0],
						img = imageModel.get('image') ? imageModel.get('image') : result.models[0],
						url = 'src' in img ? img.src : ('get' in img ? img.get('original_url') : false)
					;

					me.editor.insert('url("' + url + '")');
					me.editor.focus();
				});
			},

			startInsertFontWidget: function() {
				var insertFontWidget = new Fonts.Insert_Font_Widget({ collection: Fonts.theme_fonts_collection });
				$('#insert-font-widget').html(insertFontWidget.render().el);
			},

			getElementType: function(model){
				var type = model.get_property_value_by_name('type'),
					styleType = this.elementTypes[type]
				;
				return styleType || type;
			},

			addSelector: function(e){
				var selector = $(e.target).data('selector');
				if( !_.isUndefined( this.editor ) ){
					this.editor.insert(selector);
					this.editor.focus();
				}

			}
		});
	});
}(jQuery));
