package com.ork8stra;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import io.fabric8.kubernetes.client.KubernetesClient;
import org.mockito.Answers;

@SpringBootTest
class Ork8straApplicationTests {

    @MockBean(answer = Answers.RETURNS_DEEP_STUBS)
    private KubernetesClient kubernetesClient;

    @Test
    void contextLoads() {
    }

}
