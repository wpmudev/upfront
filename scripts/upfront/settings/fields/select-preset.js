define(function() {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var SelectPresetField = Upfront.Views.Editor.Field.Chosen_Select.extend({
		className: 'preset select-preset-field',
		render: function() {
			Upfront.Views.Editor.Field.Chosen_Select.prototype.render.call(this);
			var me = this;
			var selectWidth = '';
			var preset = this.$el.find('.upfront-chosen-select').val();

			this.$el.find('.upfront-chosen-select').chosen({
				search_contains: true,
				width: '175px',
				disable_search: !Upfront.Application.user_can("MODIFY_PRESET")
			});

			if (Upfront.Application.user_can("MODIFY_PRESET")) {
				var html = ['<a href="#" title="'+ l10n.add_preset_label +'" class="upfront-preset-add">'+ l10n.add_label +'</a>'];
				this.$el.find('.chosen-search').append(html.join(''));
			}

			this.$el.on('click', '.upfront-preset-add', function(event) {
				event.preventDefault();
				if (!Upfront.Application.user_can("MODIFY_PRESET")) return false;

				var preset_name = me.$el.find('.chosen-search input').val();

				if (preset_name.trim() === '') {
					alert(l10n.not_empty_label);
					return;
				}
				if (preset_name.match(/[^A-Za-z0-9 ]/)) {
					alert(l10n.special_character_label);
					return;
				}
				if (!preset_name.match(/^[A-Za-z][A-Za-z0-9 ]*$/)) {
					alert(l10n.invalid_preset_label);
					return;
				}

				me.trigger('upfront:presets:new', preset_name.trim());
			});

			return this;
		},

		get_value_html: function (value, index) {
			var selected = '';
			var currentPreset = this.get_saved_value() ? this.get_saved_value() : 'default';
			if (value.value === this.clear_preset_name(currentPreset)) selected = ' selected="selected"';
			
			
			// If default preset change label to make more sense which element is edited
			if(value.value === "default") {
				var elementType = this.get_element_type(this.model.get_property_value_by_name('type'));
				value.label = 'default ' + elementType.label.toLowerCase();
			}

			return ['<option value="', value.value, '"', selected, '>', value.label, '</option>'].join('');
		},

		clear_preset_name: function(preset) {
			preset = preset.replace(' ', '-');
			preset = preset.replace(/[^-a-zA-Z0-9]/, '');
			return preset;
		},
		
		get_element_type: function(type) {
			var elementTypes = {
				UaccordionModel: {label: l10n.accordion, id: 'accordion'},
				UcommentModel: {label: l10n.comments, id: 'comment'},
				UcontactModel: {label: l10n.contact_form, id: 'contact'},
				UgalleryModel: {label: l10n.gallery, id: 'gallery'},
				UimageModel: {label: l10n.image, id: 'image'},
				LoginModel: {label: l10n.login, id: 'login'},
				LikeBox: {label: l10n.like_box, id: 'likebox'},
				MapModel: {label: l10n.map, id: 'map'},
				UnewnavigationModel: {label: l10n.navigation, id: 'nav'},
				ButtonModel: {label: l10n.button, id: 'button'},
				PostsModel: {label: l10n.posts, id: 'posts'},
				UsearchModel: {label: l10n.search, id: 'search'},
				USliderModel: {label: l10n.slider, id: 'slider'},
				SocialMediaModel: {label: l10n.social, id: 'social'},
				UtabsModel: {label: l10n.tabs, id: 'tab'},
				ThisPageModel: {label: l10n.page, id: 'this_page'},
				ThisPostModel: {label: l10n.post, id: 'this_post'},
				UwidgetModel: {label: l10n.widget, id: 'widget'},
				UyoutubeModel: {label: l10n.youtube, id: 'youtube'},
				PlainTxtModel: {label: l10n.text, id:'text'}
			};
			
			return elementTypes[type];
		},
	});

	return SelectPresetField;
});
