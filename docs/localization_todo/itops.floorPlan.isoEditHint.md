# itops.floorPlan.isoEditHint

- **English value**: `Drag cabinets and objects onto floor tiles. Pick a card in the object picker to carry it with the cursor and click a tile to place it; right-click cancels. Click an empty tile to add a rack.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/ServerRoomIsoView.tsx`
- **UI role**: `status`
- **User flow**: Hint line under the 2.5D Server Room view while edit mode is on, explaining drag placement, the cursor-carried object ghost from the picker column, right-click cancel, and empty-tile rack creation.
- **Tone**: concise instructional guidance
- **Placeholders**: none
- **Context/meaning**: Changed string — the previous translation predates the cursor-carried placement preview and right-click cancel. "Carry it with the cursor" means the picked object follows the mouse as a placement preview; "right-click cancels" disarms the picked card without placing.
- **Domain notes**: "Rack", "tile", and "object picker" follow the existing IT Ops floor-plan terminology already translated in this namespace; keep them consistent with `itops.floorPlan.pickerTitle` and `itops.floorPlan.isoAddHere`.

<!--
Filename: itops.floorPlan.isoEditHint.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
