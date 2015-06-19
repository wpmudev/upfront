define([
	'scripts/upfront/inline-panels/panels',
	'scripts/upfront/inline-panels/panel',
	'scripts/upfront/inline-panels/item',
	'scripts/upfront/inline-panels/item-multi',
	'scripts/upfront/inline-panels/control',
	'scripts/upfront/inline-panels/multi-control',
	'scripts/upfront/inline-panels/tooltip-control',
	'scripts/upfront/inline-panels/control-panel',
	'scripts/upfront/inline-panels/dialog-control',
	'scripts/upfront/inline-panels/collapsed-multi-control',
	'scripts/upfront/inline-panels/controls/visit-link',
	'scripts/upfront/inline-panels/controls/link-panel'
], function (Panels, Panel, Item, ItemMulti, Control, MultiControl, TooltipControl,
	ControlPanel, DialogControl, CollapsedMultiControl, VisitLinkControl, LinkPanelControl) {
	return {
		Panels: Panels,
		Panel: Panel,
		Item: Item,
		ItemMulti: ItemMulti,
		Control: Control,
		MultiControl: MultiControl,
		TooltipControl: TooltipControl,
		ControlPanel: ControlPanel,
		DialogControl: DialogControl,
		CollapsedMultiControl: CollapsedMultiControl,
		Controls: {
			VisitLink: VisitLinkControl,
			LinkPanel: LinkPanelControl
		}
	};
});
