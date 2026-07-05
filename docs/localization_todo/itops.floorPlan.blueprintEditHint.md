# itops.floorPlan.blueprintEditHint

- **English value**: `Drag racks and objects between floor cells. Pick a card in the object picker to carry it with the cursor and click a cell to place it; right-click cancels. The rotate control turns a rack's front.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/ServerRoomFloorPlan.tsx`
- **UI role**: `status`
- **User flow**: Hint line under the top-down Server Room floor plan while edit mode is on, explaining drag placement, the cursor-carried object ghost from the picker column, right-click cancel, and the facing rotate control.
- **Tone**: concise instructional guidance
- **Placeholders**: none
- **Context/meaning**: Changed string — the previous translation predates the cursor-carried placement preview and right-click cancel. "Carry it with the cursor" means the picked object follows the mouse as a placement preview; "right-click cancels" disarms the picked card without placing.
- **Domain notes**: "Rack", "cell", and "object picker" follow the existing IT Ops floor-plan terminology already translated in this namespace; keep them consistent with `itops.floorPlan.pickerTitle` and `itops.floorPlan.rotateTitle`.

<!--
Filename: itops.floorPlan.blueprintEditHint.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
