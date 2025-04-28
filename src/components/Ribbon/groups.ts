/* Button config factory
   ─────────────────────
   Pass in `hasSelection` (true when a module is selected) and receive
   the ribbon groups array used by <Ribbon />. */

export const TOOL_GROUPS = (hasSelection: boolean) =>
  [
    {
      label: 'Tools',
      buttons: [
        { id: 'select', text: 'Select', disabled: false },
        { id: 'draw-module', text: 'Module', disabled: false },
        { id: 'draw-corridor', text: 'Corridor', disabled: false }, // Added corridor tool
        { id: 'copy', text: 'Copy', disabled: false },
        { id: 'remove', text: 'Delete', disabled: false },
      ],
    },
    {
      label: 'Components',
      buttons: [
        { id: 'draw-opening', text: 'Opening', disabled: !hasSelection },
        { id: 'draw-balcony', text: 'Balcony', disabled: !hasSelection },
        { id: 'draw-bathroom', text: 'Bathroom Pod', disabled: !hasSelection },
      ],
    },
  ] as const;
