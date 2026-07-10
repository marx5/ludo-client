import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trophy, Dices, Shield, Swords } from 'lucide-react';

export default function GameRulesModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] flex flex-col p-6 text-left relative overflow-hidden shadow-2xl border border-white/10 rounded-2xl bg-gray-950/80">
        
        {/* Nút Đóng */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 text-gray-400 hover:text-white" 
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        {/* Tiêu đề */}
        <div className="border-b border-white/5 pb-4 mb-4">
          <h2 className="text-2xl font-black text-yellow-400 flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            Luật Chơi Ludo Z
          </h2>
        </div>

        {/* Nội dung cuộn */}
        <div className="overflow-y-auto pr-2 space-y-4 text-gray-300 text-sm leading-relaxed scrollbar-thin">
          
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Dices size={16} className="text-blue-400" />
              1. Đổ Xúc Xắc & Ra Quân
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mỗi người chơi đến lượt có tối đa <strong>20 giây</strong> để tung xúc xắc. Nếu hết giờ, hệ thống sẽ tự động đổ.</li>
              <li>Bạn phải đổ được <strong>6 điểm</strong> để xuất quân (ra chuồng) từ vị trí sân nhà lên ô xuất phát.</li>
              <li>Khi đổ được <strong>6 điểm</strong>, bạn được thưởng thêm <strong>1 lượt đổ mới (Bonus Roll)</strong>. Tối đa được thưởng 2 lần đổ 6 liên tiếp. Đổ được 6 lần thứ 3 sẽ bị mất lượt ngay lập tức.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Swords size={16} className="text-red-400" />
              2. Đi Quân & Đá Cờ
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mỗi người chơi có tối đa <strong>30 giây</strong> để lựa chọn quân cờ muốn di chuyển. Nếu hết giờ, hệ thống sẽ tự đi quân bất kỳ.</li>
              <li>Quân cờ di chuyển theo chiều kim đồng hồ quanh bàn cờ dựa trên số điểm xúc xắc vừa đổ.</li>
              <li>Nếu di chuyển đến ô đang có quân cờ của đối thủ đứng sẵn, quân đối thủ sẽ bị <strong>đá bay về chuồng (về vạch xuất phát)</strong>. Người vừa đá cờ được thưởng thêm <strong>1 lượt đổ mới (Bonus Roll)</strong>.</li>
              <li><strong>Luật Cản Đường:</strong> Nếu đối thủ có từ <strong>2 quân cờ trở lên đứng cùng một ô</strong>, ô đó trở thành điểm chặn. Không quân cờ nào của người chơi khác có thể đi qua hoặc đáp xuống ô này.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Shield size={16} className="text-green-400" />
              3. Vị Trí An Toàn (Safe Zones)
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Các ô có hình <strong>Ngôi Sao (Star)</strong> trên bàn cờ là ô an toàn.</li>
              <li>Tại ô an toàn, quân cờ <strong>không thể bị đá</strong> bởi bất kỳ người chơi nào. Nhiều người chơi khác màu có thể đứng chung ô an toàn một cách yên bình.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1.5">
              <Trophy size={16} className="text-yellow-400" />
              4. Về Đích & Chiến Thắng
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sau khi đi đủ 1 vòng bàn cờ, quân cờ đi vào đường chuồng riêng (Home Stretch).</li>
              <li>Mỗi khi đưa một quân cờ về đích thành công (đạt bước 58), người chơi được thưởng thêm <strong>1 lượt đổ mới (Bonus Roll)</strong>.</li>
              <li><strong>Chế độ 1vs1:</strong> Người chơi đầu tiên đưa đủ <strong>4 quân cờ về đích</strong> sẽ chiến thắng.</li>
              <li><strong>Chế độ Đồng Đội 2vs2:</strong> Hai người chơi cùng đội (đối xứng chéo) phối hợp. Cả hai thành viên của đội đều phải đưa đủ cờ về đích để giành chiến thắng. Đồng đội cùng đội có thể đi qua nhau tự do và không thể đá cờ của nhau.</li>
            </ul>
          </div>

        </div>

        {/* Nút đóng ở chân */}
        <div className="border-t border-white/5 pt-4 mt-4 text-right">
          <Button onClick={onClose} className="bg-yellow-500/40 hover:bg-yellow-500/60 text-yellow-100 font-bold border-yellow-500/50">
            Đã Hiểu
          </Button>
        </div>

      </div>
    </div>
  );
}
