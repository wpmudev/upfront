define(function() {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var SelectPresetField = Upfront.Views.Editor.Field.Chosen_Select.extend({
		className: 'preset select-preset-field',
		render: function() {
			Upfront.Views.Editor.Field.Chosen_Select.prototype.render.call(this);
			var me = this;
			var selectWidth = '';
			var preset = this.$el.find('.upfront-chosen-select').val();

			if(preset == 'default' && Upfront.Application.get_current() === Upfront.Application.MODE.THEME) {
				selectWidth = '230px';
			} else {
				selectWidth = '175px';
			}

			this.$el.find('.upfront-chosen-select').chosen({
				search_contains: true,
				width: selectWidth,
				disable_search: !Upfront.Application.user_can("CREATE_PRESET")
			});

			if (Upfront.Application.user_can("CREATE_PRESET")) {
				var html = ['<a href="#" title="'+ l10n.add_preset_label +'" class="upfront-preset-add">'+ l10n.add_label +'</a>'];
				this.$el.find('.chosen-search').append(html.join(''));
			}

			this.$el.on('click', '.upfront-preset-add', function(event) {
				event.preventDefault();
				if (!Upfront.Application.user_can("CREATE_PRESET")) return false;

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
			return ['<option value="', value.value, '"', selected, '>', value.label, '</option>'].join('');
		},

		clear_preset_name: function(preset) {
			preset = preset.replace(' ', '-');
			preset = preset.replace(/[^-a-zA-Z0-9]/, '');
			return preset;
		},
	});

	return SelectPresetField;
});
