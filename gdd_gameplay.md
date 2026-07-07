# GDD — Gameplay Design: **Đua Ghe Ngo Sóc Trăng**

Tài liệu mô tả **chơi thế nào** (WHAT). Kiến trúc kỹ thuật xem `cau_truc_game.md`.

---

## 1. Tầm nhìn sản phẩm

| Mục tiêu | Mô tả |
|---|---|
| **Thể loại** | Arcade rhythm-racing + quản lý nhịp độ ngắn |
| **Nền tảng** | H5 (mobile-first), PWA offline/online |
| **Thời lượng 1 trận** | 60–90 giây |
| **Cảm xúc chủ đạo** | Hồi hộp, sôi động, tự hào văn hóa Khmer |
| **Độ khó** | 3 tap để hiểu luật; top 1% mới master |

**Tagline:** *"Chèo đúng nhịp — Về đích Sóc Trăng!"*

---

## 2. Fantasy cốt lõi

Người chơi là **Tổ trưởng đội chèo** (hoặc **người gõ trống điều nhịp**) của đội ghe Ngo đại diện xã/phường, leo rank từ **giải làng → huyện → tỉnh → Festival ĐBSCL tại Sóc Trăng**.

Game **cô đọng** vai trò quyết định nhịp độ cả đội — không mô phỏng 60 người chèo riêng lẻ.

---

## 3. Core Loop (60–90 giây)

```
Chuẩn bị (5s) → Xuất phát → Chèo nhịp (3 phase) → Đoạn căng (QTE) → Về đích → Kết quả + thưởng
```

### Phase 1–3: Chèo nhịp (~15s mỗi phase)

- Vạch nhịp xuất hiện trên màn hình (rhythm game nhẹ)
- **Tap đúng beat** → tích **Đồng bộ (Sync)**
- **Perfect / Good / Miss:**
  - Perfect: +tốc độ, +Sync
  - Good: +tốc độ nhẹ
  - Miss: -Sync, ghe lắc, mất tốc độ

**Sync bar (0–100%):**
- Cao → ghe nhanh, ổn định
- Thấp → ghe lắc, dễ bị vượt
- < 30% → nguy cơ **lật nhẹ** (phạt 2s)

### Đoạn căng (Clutch Moment) — 1 lần/trận

Khi còn ~200m về đích:
- 5 tap liên tiếp trong 3 giây
- Thành công: **Boost 3s** (tốc độ ×1.5)
- Thất bại: mất Sync, đối thủ có cơ hội vượt

### Về đích

- Camera zoom out, khán đài reo hò
- Hiển thị hạng + thưởng + nút Chơi lại / Chia sẻ

---

## 4. Điều khiển

| Thao tác | Chức năng |
|---|---|
| **Tap** | Chèo theo nhịp |
| **Giữ (Hold) 1s** | **Giữ nhịp** — tăng Sync khi đang ổn định |
| **Vuốt trái/phải** | **Lái ghe** — tránh sóng/gió (giải khó trở lên) |

**Không dùng:** combo phức tạp, nhiều nút, joystick.

---

## 5. Hệ thống "dễ chơi, khó thắng"

### 5.1. AI personality

| Đội | Đặc điểm | Cách thắng |
|---|---|---|
| Sóc Trăng (chủ nhà) | Ổn định, mạnh cuối | Không để dẫn sát đích |
| Trà Vinh | Bứt tốc đầu trận | Giữ Sync cao từ đầu |
| Cà Mau | Chậm rồi bứt cuối | Dành Boost cho clutch |
| Ngẫu nhiên | Dao động | Khai thác lúc họ Miss |

AI phản ứng theo vị trí: dẫn đầu → giữ nhịp; bị vượt → tăng rủi ro.

### 5.2. Stamina (thể lực đội)

- Perfect tốn ít stamina; Miss/spam tap tốn nhiều
- Stamina thấp → vùng Perfect hẹp lại
- Phải **chọn lúc Hold** thay vì tap liên tục

### 5.3. Môi trường (random mỗi trận, seed-based)

| Sự kiện | Hiệu ứng |
|---|---|
| Sóng ngược | -10% tốc độ |
| Gió thuận | +5% tốc độ |
| Nước cạn | Cần swipe lái |
| Mưa nhẹ | Beat lệch nhẹ |

### 5.4. Độ chính xác cần để thắng

| Hạng mục | Yêu cầu Top 1 |
|---|---|
| Giải làng | ~70% Perfect |
| Giải huyện | ~80% Perfect + 1 clutch thành công |
| Festival Sóc Trăng | ~90% Perfect + clutch + quản lý stamina |

---

## 6. Chế độ chơi

### 6.1. Story Mode — "Con đường về Sóc Trăng"

| Chương | Nội dung | Đội |
|---|---|---|
| 1. Làng quê | Tutorial mở rộng | 2 đội |
| 2. Xã/huyện | Sóng nhẹ | 4 đội |
| 3. Liên tỉnh | AI khó hơn | 6 đội |
| 4. Vòng loại ĐBSCL | Yếu tố môi trường | 8 đội |
| 5. Chung kết Sóc Trăng | Boss đội chủ nhà | 8 đội elite |

**Cốt truyện nhẹ:** Đội trẻ làng được chọn thay đội già. NPC (thầy làm ghe, trưởng làng, HLV) cho tip trước trận.

### 6.2. Quick Race

- Chọn đội + map → đua ngay (~1 phút)
- Phù hợp chia sẻ mạng xã hội

### 6.3. Daily Challenge

- 1 trận/ngày, điều kiện đặc biệt (vd: "Miss tối đa 3 lần")
- Bảng xếp hạng tuần (online)
- Offline: local seed; online: server seed

### 6.4. Ghost Race (Phase 2)

- Lưu replay thành "bóng ma" đua cùng bạn bè
- Async — không cần server realtime

---

## 7. Meta-game & Progression

### 7.1. Nâng cấp (soft progression)

| Hạng mục | Hiệu ứng | Cap |
|---|---|---|
| Ghe (thân tàu) | +tốc độ max | ≤ 15% tổng |
| Đội chèo | +stamina | Vẫn cần skill |
| Trống nhịp | Vùng Perfect +5% | Chỉ giải dưới |
| Áo đội | Cosmetic | — |

### 7.2. Bộ sưu tập

- 18 đội tỉnh ĐBSCL (unlock khi đánh bại)
- Trang phục truyền thống Khmer
- Hiệu ứng khán đài (cờ, trống, pháo giấy)

### 7.3. Tiền tệ

- **Vàng lúa** (in-game): thắng trận, daily
- Dùng: nâng cấp, skin — **không pay-to-win**

---

## 8. Art & Audio direction

### Visual

- **Màu:** Vàng, đỏ, xanh nước — sắc lễ hội Khmer
- **Bối cảnh:** Sông Maspéro, khán đài A–B, chùa xa, đèn lồng
- **Ghe Ngo:** Thân dài, đầu rồng/mặt quỷ stylized
- **Camera:** Side-scroll 2.5D hoặc top-down nghiêng

### Audio

- **Trống Khmer** làm beat chính
- Tiếng hô **"Oy! Oy!"** khi cổ vũ
- Đám đông reo khi vượt đối thủ
- Tempo tăng dần về đích

### Juice

- Rung nhẹ khi Perfect
- Nước bắn khi chèo mạnh
- Slow-motion 0.5s khi về đích sát nhau

---

## 9. UX flow màn hình

```
[Splash: Lễ hội Oóc Om Bóc]
    ↓
[Menu: Chơi ngay | Story | Daily | Bộ sưu tập | Cài đặt]
    ↓
[Chọn đội + xem chỉ số đối thủ]
    ↓
[Countdown 3-2-1 + trống nổ]
    ↓
[Gameplay 60-90s]
    ↓
[Kết quả: Hạng | % Perfect | Thưởng | Chia sẻ]
```

---

## 10. Công thức tốc độ (tham chiếu `config/game.config.ts`)

```
speed = baseSpeed
      + (syncPercent × 0.4)
      + (perfectRate × 0.3)
      - staminaPenalty
      - environmentMod
      + boostIfActive
```

- `syncPercent`: trung bình Sync 2s gần nhất
- `perfectRate`: % Perfect trong phase hiện tại
- Đối thủ: cùng công thức + personality modifier

---

## 11. Kịch bản trận mẫu (75 giây)

> **Giải huyện — Bạn vs Đội Trà Vinh**
>
> 0:00 — Trống nổ, 4 ghe xuất phát. 2 Perfect đầu → Sync 60%.
> 0:20 — Trà Vinh vượt nhẹ. Hold 1s → Sync 85%, vượt lại.
> 0:35 — Sóng ngược, tốc độ chậm. Stamina 70%.
> 0:50 — Clutch thành công, Boost 3s, dẫn đầu.
> 1:05 — Trà Vinh bứt cuối. Miss 1 nhịp → bị sát vách.
> 1:12 — Về đích hạng 2, cách 0.3s. *"Gần rồi! Thử lại?"*

Thua sát sao → động lực chơi lại, không frustrate.

---

## 12. Mapping GDD → Code

| GDD | Module code |
|---|---|
| Tap / Hold / Swipe | `core/rhythm/InputJudge.ts` |
| Sync bar | `core/race/RaceState.ts` + `ui/components/SyncBar.ts` |
| Stamina | `core/race/RaceSimulator.ts` |
| AI personality | `core/ai/AIPersonality.ts`, `config/teams.config.ts` |
| Môi trường | `core/race/EnvironmentModifier.ts` |
| Clutch QTE | `core/race/RaceSimulator.ts` (event `CLUTCH_AVAILABLE`) |
| Story chapters | `config/chapters.config.ts` |
| Nâng cấp | `core/progression/UpgradeSystem.ts` |
| Điểm / replay | `core/scoring/ScoreCalculator.ts`, `ReplayEncoder.ts` |
