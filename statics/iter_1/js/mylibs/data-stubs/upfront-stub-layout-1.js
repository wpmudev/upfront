define({
	"name": "Layout 1",
	"regions": [
	{
		"name": "Main",
		"modules" : [
			// Module 1
			{
				"name": "Module 1",
				"properties": [
					{"name": "element_id", "value": "object-1"},
					{"name": "class", "value": "c8 ml1"},
				],
				"objects": [
					{
						"name": "Module 1 - Object 1",
						"properties": [
							{"name": "element_id", "value": "object-1-1"},
							{"name": "class", "value": "c11"}
						]
					},
					{
						"name": "Module 1 - Object 2",
						"properties": [
							{"name": "element_id", "value": "object-1-2"},
							{"name": "class", "value": "c11"}
						]
					}
				]
			},
			// Module 2
			{
				"name": "Module 2",
				"properties": [
					{"name": "element_id", "value": "object-2"},
					{"name": "class", "value": "c8 ml1"},
				],
				"objects": [
					{
						"name": "Module 2 - Object 1",
						"properties": [
							{"name": "element_id", "value": "object-2-1"},
							{"name": "class", "value": "c11"}
						]
					},
					{
						"name": "Module 2 - Object 2",
						"properties": [
							{"name": "element_id", "value": "object-2-2"},
							{"name": "class", "value": "c11"}
						]
					}
				]
			}
		], // Modules
	},
	{
		"name": "sidebar",
		"modules": [
			// M1
			{
				"name": "Sidebar-1",
				"properties": [
					{"name": "element_id", "value": "sidebar-module-1"},
					{"name": "class", "value": "c12"}
				],
				"objects": [
					{
						"name": "SO1",
						"properties": [
							{"name": "element_id", "value": "sidebar-module-1-object-1"},
							{"name": "class", "value": "c22"}
						]
					}
				]
			}
		]
	}], // Regions
});