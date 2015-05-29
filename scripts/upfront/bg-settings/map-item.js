(function($) {
	
var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/mixins',
	'text!scripts/upfront/templates/map-editor.html'
], function(Mixins, editorTpl) {
	
	var MapItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		events: {
			"click .open-map-code-panel-button": "init_code_panel"
		},
		group: false,
		initialize: function (options) {
			var me = this,
				map_center = this.model.get_property_value_by_name('background_map_center'),
				set_value = function () {
					var value = this.get_value();
					this.model.set_breakpoint_property(this.property_name, value);
				};
				
			if ( ! map_center ){
				this.model.init_property('background_map_center', [10.722250, 106.730762]);
				this.model.init_property('background_map_zoom', 10);
				this.model.init_property('background_map_style', "ROADMAP");
				this.model.init_property('background_map_controls', "");
				this.model.init_property('background_show_markers', "");
				this.model.init_property('background_use_custom_map_code', "");
			}
			
			var fields = {
					location: new Upfront.Views.Editor.Field.Text({
						model: this.model,
						label: l10n.location + ":",
						property: 'background_map_location',
						use_breakpoint_property: true,
						placeholder: "e.g 123 Nice St",
						change: function () {
							var value = this.get_value();
							this.model.set_breakpoint_property(this.property_name, value, true);
							me._location = value;
							me._location_changed = true;
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-map-location');
						}
					}),
					refresh: new Upfront.Views.Editor.Field.Button({
						label: "",
						compact: true,
						classname: 'upfront-field-icon upfront-field-icon-refresh-2 upfront-refresh-map',
						on_click: function(){
							var $loc = me.$el.find('input[name="background_map_location"]');
							if ($loc.length) me._location = $loc.val();
							me._location_changed = true;
							me.geocode_location();
						}
					}),
					zoom: new Upfront.Views.Editor.Field.Slider({
						model: this.model,
						label: l10n.zoom + ":",
						property: 'background_map_zoom',
						use_breakpoint_property: true,
						default_value: 8,
						min: 1,
						max: 19,
						step: 1,
						change: set_value,
						rendered: function (){
							this.$el.addClass('uf-bgsettings-map-zoom');
						}
					}),
					style: new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: l10n.map_style + ":",
						property: 'background_map_style',
						use_breakpoint_property: true,
						values: [
							{ label: l10n.roadmap, value: 'ROADMAP' },
							{ label: l10n.satellite, value: 'SATELLITE' },
							{ label: l10n.hybrid, value: 'HYBRID' },
							{ label: l10n.terrain, value: 'TERRAIN' }
						],
						change: set_value,
						rendered: function (){
							this.$el.addClass('uf-bgsettings-map-style');
						}
					}),
					controls: new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: l10n.controls + ":",
						placeholder: l10n.choose_ctrl,
						property: 'background_map_controls',
						use_breakpoint_property: true,
						multiple: true,
						default_value: ["pan"],
						values: [
							{ label: l10n.pan, value: "pan" },
							{ label: l10n.zoom, value: "zoom" },
							{ label: l10n.map_type, value: "map_type" },
							{ label: l10n.scale, value: "scale" },
							{ label: l10n.street_view, value: "street_view" },
							{ label: l10n.overview_map, value: "overview_map" }
						],
						change: set_value,
						rendered: function (){
							this.$el.addClass('uf-bgsettings-map-controls');
						}
					}),
					show_markers: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						label: l10n.show_markers,
						property: "background_show_markers",
						use_breakpoint_property: true,
						hide_label: true,
						values: [{label: l10n.show_markers, value: 1}],
						multiple: false,
						change: set_value,
						rendered: function () {
							this.$el.addClass('uf-bgsettings-map-show-marker');
						}
					}),
					custom_map_code: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						label: l10n.custom_map_code,
						property: "background_use_custom_map_code",
						hide_label: true,
						values: [{label: l10n.custom_map_code + '<span class="checkbox-info" title="' + l10n.custom_map_code_info + '"></span>', value: 1}],
						multiple: false,
						change: function () {
							var value = this.get_value();

							this.property.set({value: value});

							if(value == 1) {
								$('.open-map-code-panel-button', this.$el.parent()).show();
							}
							else {
								$('.open-map-code-panel-button', this.$el.parent()).hide();
							}
						}
					}),
					open_map_code_panel: new Upfront.Views.Editor.Field.Button({
						model: me.model,
						label: l10n.open_map_code_panel,
						className: "open-map-code-panel-button",
						compact: true,
					}),
				};
			
			this.$el.addClass('uf-bgsettings-item uf-bgsettings-mapitem');
			
			options.fields = _.map(fields, function(field){ return field; });
			
			this._location = fields.location.get_value();
			
			this.$el.on('keypress', 'input[name="background_map_location"]', function (e) {
				if( e.keyCode === 13 ){
					me._location = $(this).val();
					me._location_changed = true;
					me.geocode_location();
				}
			});
			
			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);
		},
		render: function () {
			Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
			$('[name="background_use_custom_map_code"]', this.$el).trigger('change');
		},
		geocode_location: function () {
			if ( this._geocoding == true || !this._location_changed )
				return;
			var me = this,
				location = this._location,
				geocoder = new google.maps.Geocoder()
			;
			if (!location) return;
			this._geocoding = true;
			geocoder.geocode({address: location}, function (results, status) {
				if (status != google.maps.GeocoderStatus.OK) return false;
				var pos = results[0].geometry.location;

				me.model.set_breakpoint_property("background_map_center", [pos.lat(), pos.lng()]);
				me._geocoding = false;
				me._location_changed = false;
			});
		},
		init_code_panel: function () {
			var view = new this.create_code({model: this.model});
			view.render();
		},
		create_code: Upfront.Views.ObjectView.extend({

			is_editing: false,
			script_error: false,

			SYNTAX_TYPES: {
				"script": "json"
			},

			MIN_HEIGHT: 200,

			editorTpl: _.template(editorTpl),

			content_editable_selector: ".editable",

			initialize: function() {
				var json = this.fallback('script');
				this.checkJSon(json);
			},

			on_render: function () {
				this.start_json_editor();
			},

			start_json_editor: function () {
				if (this.is_editing) return false;

				this.is_editing = true;
				var $editor = $('#upfront_map-editor');

				if(!$editor.length){
					$editor = $('<section id="upfront_map-editor" class="upfront-ui upfront_map-editor upfront_map-editor-complex"></section>');
					$('body').append($editor);
				}

				this.createEditor($editor);

			},

			on_edit: function(){
				if (this.is_editing) return false;

				// Since we're doing double duty here, let's first check if content editing mode is to boot
				var $contenteditables = this.$el.find('.upfront_map-element ' + this.content_editable_selector);
				if ($contenteditables.length) {
					// Yes? go for it
					return this.bootContentEditors($contenteditables);
				}
				// Oh well, let's just go ahead and boot code editing mode.
				this.is_editing = true;
				var $editor = $('#upfront_map-editor');

				if(!$editor.length){
					$editor = $('<section id="upfront_map-editor" class="upfront-ui upfront_map-editor upfront_map-editor-complex"></section>');
					$('body').append($editor);
				}

				this.createEditor($editor);
			},

			bootContentEditors: function ($editables) {
				if (!$editables || !$editables.length) return false;
				var $markup = $(this.fallback("markup")),
					me = this
				;
				$editables.each(function (idx) {
					var $me = $(this),
						start = idx <= 0
					;
					if ($me.data('ueditor')) return true;
					$me
						.ueditor({
							autostart: start,
							placeholder: "",
							disableLineBreak: true
						})
						.on("start", function () {
							me.is_editing = true;
						})
						.on("stop", function () {
							me.is_editing = false;
						})
						.on('syncAfter', function(){
							var $existing = $($markup.find(me.content_editable_selector)[idx]);
							if (!$existing.length) return false;
							$existing.html($me.html());
							me.property(
								"markup",
								$("<div />").append($markup).html()
							);
						})
					;
				});
			},

			createEditor: function($editor){
				var me = this;
				$editor.html(this.editorTpl({
					markup: this.fallback('markup'),
					style: this.fallback('style'),
					script: this.fallback('script'),
					l10n: l10n.template
				}));

				$('#page').css('padding-bottom', '200px');
				$editor.show();

				this.resizeHandler = this.resizeHandler || function(){
					$editor.width($(window).width() - $('#sidebar-ui').width() -1);
				};
				$(window).on('resize', this.resizeHandler);
				this.resizeHandler();

				//Start the editors
				this.editors = {};
				this.timers = {};

				$editor.find('.upfront_map-ace').each(function(){
					var $this = $(this),
						html = $this.html(),
						editor = ace.edit(this),
						syntax = $this.data('type')
					;

					editor.getSession().setUseWorker(false);
					editor.setTheme("ace/theme/monokai");
					editor.getSession().setMode("ace/mode/" + me.SYNTAX_TYPES[syntax]);
					editor.setShowPrintMargin(false);

					if ("markup" === syntax && html)
							editor.getSession().setValue(html);

					// Live update
					editor.on('change', function(){
						if(me.timers[syntax])
							clearTimeout(me.timers[syntax]);
						me.timers[syntax] = setTimeout(function(){
							var value = editor.getValue();

							if(syntax == 'script')
								me.checkJSon(value);

							if(me.script_error)
								$editor.find('.upfront_map-jsalert').show().find('i').attr('title', l10n.create.js_error + ' ' + me.script_error);
							else
								$editor.find('.upfront_map-jsalert').hide();

							me.property(syntax, value, false);
						}, 1000);
					});

					// Set up the proper vscroller width to go along with new change.
					editor.renderer.scrollBar.width = 5;
					editor.renderer.scroller.style.right = "5px";

					me.editors[syntax] = editor;
				});
				this.currentEditor = this.editors['markup'];

				var editorTop = $editor.find('.upfront-css-top'),
					editorBody = $editor.find('.upfront-css-body')
				;

				//Start resizable
				editorBody.height(this.MIN_HEIGHT - editorTop.outerHeight());
				$editor.find(".upfront_map-editor-complex-wrapper").resizable({
					handles: {
						n: ".upfront-css-top"
					},
					resize: function(e, ui){
						editorBody.height(ui.size.height - editorTop.outerHeight());
						_.each(me.editors, function(editor){
							editor.resize();
						});
					},
					minHeight: me.MIN_HEIGHT,
					delay:  100
				});

				//save edition
				$editor.find('button').on('click', function(e){
					_.each(me.editors, function(editor, type){
						me.property(type, editor.getValue());
					});

					me.property('background_map_styles', me.fallback('script'));
					me.is_editing = false;
					me.destroyEditor();
				});

				//Highlight element
				$editor
					.on('click', '.upfront-css-type', function(e){
						me.hiliteElement(e);
					}) // Close editor
					.on('click', '.upfront-css-close', function(e){
						e.preventDefault();
						me.destroyEditor();
						$('#page').css('padding-bottom', 0);
					})
				;
			},

			destroyEditor: function(){
				var me = this;
				if(this.editors && this.editors.length){
					_.each(this.editors, function(ed){
						ed.destroy();
					});
					me.editors = false;
				}
				this.currentEditor = false;
				$('#upfront_map-editor').html('').hide();
				$(window).off('resize', this.resizeHandler);
				this.is_editing = false;
			},

			hiliteElement: function(e){
				e.preventDefault();
				var element = this.$el.find('.upfront-object-content');
				var offset = element.offset().top - 50;
				$(document).scrollTop(offset > 0 ? offset : 0);
				this.blink(element, 4);
			},

			blink: function(element, times) {
				var me = this;
				element.css('outline', '3px solid #3ea');
				setTimeout(function(){
					element.css('outline', 'none');

					times--;
					if(times > 0){
						setTimeout(function(){
							me.blink(element, times - 1);
						}, 100);
					}

				}, 100);
			},

			checkJSon: function(json){
				this.script_error = false;
				try {
					eval(json);
				} catch (e) {
					this.script_error = e.message;
				}
			},

			fallback: function(attribute){
				return this.model.get_property_value_by_name(attribute) || Upfront.data.upfront_code.defaults.fallbacks[attribute];
			},

			property: function(name, value, silent) {
				if(typeof value != "undefined"){
					if(typeof silent == "undefined")
						silent = true;
					return this.model.set_property(name, value, silent);
				}
				return this.model.get_property_value_by_name(name);
			}
		})
	}));

	return MapItem;
});
})(jQuery);
