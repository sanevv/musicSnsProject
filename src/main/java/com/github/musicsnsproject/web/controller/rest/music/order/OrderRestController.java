package com.github.musicsnsproject.web.controller.rest.music.order;

import com.github.musicsnsproject.service.music.order.OrderService;
import com.github.musicsnsproject.web.dto.music.cart.CartResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/order")
@RequiredArgsConstructor
public class OrderRestController {

    private final OrderService orderService;

    // 주문 미리보기!!
    @GetMapping("list")
    public ResponseEntity<List<CartResponse>> orderPreview(@AuthenticationPrincipal Long userId,
                                                           @RequestParam("cartIdList") List<Long> cartIdList) {

        return ResponseEntity.ok(orderService.getOrderPreviewList(userId, cartIdList));
    }

    // 주문 생성하기
    @PostMapping("create")
    public ResponseEntity<List<CartResponse>> orderCreate(@AuthenticationPrincipal Long userId,
                                                          @RequestParam("cartIdList") List<Long> cartIdList){

        // 구매한적 있는 음악 체크하기
        orderService.purchasedMusicCheck(userId, cartIdList);

        // 보유 코인 체크하기
        orderService.checkCoin(userId, cartIdList);

        return ResponseEntity.ok(orderService.getOrderPreviewList(userId, cartIdList));
    }

    // 주문 확정하기
    @PostMapping("confirm")
    public ResponseEntity<String> orderConfirm(@AuthenticationPrincipal Long userId,
                                               @RequestParam("cartIdList") List<Long> cartIdList) {

        orderService.orderConfirm(userId, cartIdList);

        return ResponseEntity.ok("주문이 성공적으로 완료되었습니다.");
    }
}
