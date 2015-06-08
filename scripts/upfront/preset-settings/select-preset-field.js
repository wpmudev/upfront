define(function() {
	var SelectPresetField = Upfront.Views.Editor.Field.Chosen_Select.extend({
		className: 'preset select-preset-field',
		render: function() {
			Upfront.Views.Editor.Field.Chosen_Select.prototype.render.call(this);
			var me = this;
			var selectWidth = '';
			var preset = this.$el.find('.upfront-chosen-select').val();
			
			if(preset == 'default') {
				selectWidth = '230px';
			} else {
				selectWidth = '175px';
			}
			this.$el.find('.upfront-chosen-select').chosen({
				width: selectWidth
			});
			
			var html = ['<a href="#" title="Add preset" class="upfront-preset-add">Add</a>'];
			this.$el.find('.chosen-search').append(html.join(''));
			
			this.$el.on('click', '.upfront-preset-add', function(event) {
				event.preventDefault();
				
				var preset_name = me.$el.find('.chosen-search input').val();
				
				if (preset_name.trim() === '') {
					alert('Preset name can not be empty.');
					return;
				}
				if (preset_name.match(/[^A-Za-z0-9 ]/)) {
					alert('Preset name can contain only numbers, letters and spaces.');
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
