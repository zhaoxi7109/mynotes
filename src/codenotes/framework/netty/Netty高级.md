---
title: Netty高级
# 当前页面图标
icon: write
# 分类
category:
  - Netty
  - 网络编程
# 标签
tag:
  - 序列化
  - 参数调优
  - RPC框架
sticky: false
# 是否收藏在博客主题的文章列表中，当填入数字时，数字越大，排名越靠前。
star: false
# 是否将该文章添加至文章列表中
article: true
# 是否将该文章添加至时间线中
timeline: true
---

## 一、优化

### 1、扩展序列化算法

#### 1、序列化接口

```java
public interface Serializer {
    /**
     * 序列化
     *
     * @param object 被序列化的对象
     * @param <T>    被序列化对象类型
     * @return 序列化后的字节数组
     */
    <T> byte[] serialize(T object);

    /**
     * 反序列化
     *
     * @param clazz 反序列化的目标类的Class对象
     * @param bytes 被反序列化的字节数组
     * @param <T>   反序列化目标类
     * @return 反序列化后的对象
     */
    <T> T deserialize(Class<T> clazz, byte[] bytes);
}
```

#### 2、序列化接口的实现

JDK原生序列化算法和Json序列化算法

```java
public enum SerializerAlgorithm implements Serializer {
    //Java的序列化及反序列方式
    Java {
        @Override
        public <T> byte[] serialize(T object) {
            System.out.println("使用Java方式序列化");
            // 序列化后的字节数组
            byte[] bytes = null;
            //自动关闭资源
            try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
                 ObjectOutputStream oos = new ObjectOutputStream(bos)) {
                //将对象写入到输出流中
                oos.writeObject(object);
                //转换为字节数组
                bytes = bos.toByteArray();
            } catch (IOException e) {
                e.printStackTrace();
            }
            return bytes;
        }

        @Override
        public <T> T deserialize(Class<T> clazz, byte[] bytes) {
            System.out.println("使用Java方式反序列化");
            T target = null;
            try (ByteArrayInputStream bis = new ByteArrayInputStream(bytes);
                 ObjectInputStream ois = new ObjectInputStream(bis)) {
                //强转
                target = (T) ois.readObject();
            } catch (IOException | ClassNotFoundException e) {
                e.printStackTrace();
            }
            // 返回反序列化后的对象
            return target;
        }
    },
    //Json的序列化的反序列化
    Json {
        @Override
        public <T> byte[] serialize(T object) {
            System.out.println("使用Json方式序列化");
            String s = new Gson().toJson(object);
            // 指定字符集，获得字节数组
            return s.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public <T> T deserialize(Class<T> clazz, byte[] bytes) {
            System.out.println("使用Json方式反序列化");
            String s = new String(bytes, StandardCharsets.UTF_8);
            // 此处的clazz为具体类型的Class对象，而不是父类Message的
            return new Gson().fromJson(s, clazz);
        }
    }
}
```

#### 3、用户指定序列化方式

从配置文件中获取

```java
public abstract class Config {
    static Properties properties;

  //静态代码块
    static {
        try (InputStream in = Config.class.getResourceAsStream("/application.properties")) {
            properties = new Properties();
            properties.load(in);
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    public static int getServerPort() {
        String value = properties.getProperty("server.port");
        if (value == null) {
            return 8080;
        } else {
            return Integer.parseInt(value);
        }
    }

    public static SerializerAlgorithm getSerializerAlgorithm() {
        String value = properties.getProperty("serializer.algorithm");
        if (value == null) {
            //默认使用Java序列化方式
            return SerializerAlgorithm.Java;
        } else {
            //使用配置文件指定的方式
            return SerializerAlgorithm.valueOf(value);
        }
    }


}
```

#### 4、改造编解码器

使其可以按照指定的方式进行序列化及反序列化

```java
@Slf4j
@ChannelHandler.Sharable
/**
 * 必须和 LengthFieldBasedFrameDecoder 一起使用，确保接到的 ByteBuf 消息是完整的
 */
public class MessageCodecSharable extends MessageToMessageCodec<ByteBuf, Message> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Message msg, List<Object> outList) throws Exception {
        ByteBuf out = ctx.alloc().buffer();
        // 1. 4 字节的魔数
        out.writeBytes(new byte[]{1, 2, 3, 4});
        // 2. 1 字节的版本,
        out.writeByte(1);
        // 3. 1 字节的序列化方式 jdk 0 , json 1
      //重点改造
        out.writeByte(Config.getSerializerAlgorithm().ordinal());
        // 4. 1 字节的指令类型
        out.writeByte(msg.getMessageType());
        // 5. 4 个字节
        out.writeInt(msg.getSequenceId());
        // 无意义，对齐填充
        out.writeByte(0xff);
        // 6. 获取内容的字节数组
      //重点改造
        byte[] bytes = Config.getSerializerAlgorithm().serialize(msg);
        // 7. 长度
        out.writeInt(bytes.length);
        // 8. 写入内容
        out.writeBytes(bytes);
        outList.add(out);
    }

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        int magicNum = in.readInt();
        byte version = in.readByte();
        byte serializerType = in.readByte();
        byte messageType = in.readByte();
        int sequenceId = in.readInt();
        in.readByte();
        int length = in.readInt();
        byte[] bytes = new byte[length];
        in.readBytes(bytes, 0, length);
        //找到序列化算法
        SerializerAlgorithm serializerAlgorithm = SerializerAlgorithm.values()[serializerType];
        //确定具体的消息类型
        Class<?> messageClass = Message.getMessageClass(messageType);
        //反序列化
        Message message = (Message) serializerAlgorithm.deserialize(messageClass, bytes);
        log.debug("{}", message);
        out.add(message);
    }
}
```

#### 5、配置文件

```properties
serializer.algorithm=Java
```

#### 6、测试代码

```java
@Test
public void testSerial() {
    LoggingHandler loggingHandler = new LoggingHandler();
    MessageCodecSharable messageCodecSharable = new MessageCodecSharable();
    EmbeddedChannel embeddedChannel = new EmbeddedChannel(loggingHandler,messageCodecSharable,loggingHandler);
    //测试序列化及反序列化是否可配置
    //登陆请求消息
    LoginRequestMessage loginRequestMessage = new LoginRequestMessage("zhangsan", "123");
    //出站->打印原始对象（loggingHandler）->编码为ByteBuf，此时会进行序列化（messageCodecSharable）->打印ByteBuf（loggingHandler）
    embeddedChannel.writeOutbound(loginRequestMessage);
    //入站->打印ByteBuf（loggingHandler）->解码为原始对象，此时会进行反序列化（messageCodecSharable）->打印原始对象（loggingHandler）
    //构造一个ByteBuf
    ByteBuf byteBuf = messageToByteBuf(new LoginRequestMessage("lisi", "3456"));
    embeddedChannel.writeInbound(byteBuf);


}

/**
 * @Description: 测试入站的时候，必须首先构造一个ByteBuf
 * @Author: Mr.Tong
 */
public static ByteBuf messageToByteBuf(Message msg) {
    int algorithm = Config.getSerializerAlgorithm().ordinal();
    //分配空间
    ByteBuf out = ByteBufAllocator.DEFAULT.buffer();
    out.writeBytes(new byte[]{1, 2, 3, 4});
    out.writeByte(1);
    out.writeByte(algorithm);
    out.writeByte(msg.getMessageType());
    out.writeInt(msg.getSequenceId());
    out.writeByte(0xff);
    byte[] bytes = SerializerAlgorithm.values()[algorithm].serialize(msg);
    out.writeInt(bytes.length);
    out.writeBytes(bytes);
    return out;
}
```

#### 7、运行结果

```java
//测试出站-log首先打印原始对象
23:33:12 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] WRITE: LoginRequestMessage(super=Message(sequenceId=0, messageType=0), username=zhangsan, password=123)
  //编码
使用Java方式序列化
  //log打印编码后的ByteBuf
23:33:12 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] WRITE: 214B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 01 00 00 00 00 00 00 ff 00 00 00 c6 |................|
|00000010| ac ed 00 05 73 72 00 25 63 6e 2e 69 74 63 61 73 |....sr.%cn.itcas|
|00000020| 74 2e 6d 65 73 73 61 67 65 2e 4c 6f 67 69 6e 52 |t.message.LoginR|
|00000030| 65 71 75 65 73 74 4d 65 73 73 61 67 65 a0 3f 71 |equestMessage.?q|
|00000040| cb 31 45 b5 88 02 00 02 4c 00 08 70 61 73 73 77 |.1E.....L..passw|
|00000050| 6f 72 64 74 00 12 4c 6a 61 76 61 2f 6c 61 6e 67 |ordt..Ljava/lang|
|00000060| 2f 53 74 72 69 6e 67 3b 4c 00 08 75 73 65 72 6e |/String;L..usern|
|00000070| 61 6d 65 71 00 7e 00 01 78 72 00 19 63 6e 2e 69 |ameq.~..xr..cn.i|
|00000080| 74 63 61 73 74 2e 6d 65 73 73 61 67 65 2e 4d 65 |tcast.message.Me|
|00000090| 73 73 61 67 65 0b 0b f8 b3 48 3e 94 55 02 00 02 |ssage....H>.U...|
|000000a0| 49 00 0b 6d 65 73 73 61 67 65 54 79 70 65 49 00 |I..messageTypeI.|
|000000b0| 0a 73 65 71 75 65 6e 63 65 49 64 78 70 00 00 00 |.sequenceIdxp...|
|000000c0| 00 00 00 00 00 74 00 03 31 32 33 74 00 08 7a 68 |.....t..123t..zh|
|000000d0| 61 6e 67 73 61 6e                               |angsan          |
+--------+-------------------------------------------------+----------------+
23:33:12 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] FLUSH
23:33:12 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] FLUSH
  //测试入站时候构造ByteBuf，此时会调用一次序列化过程
使用Java方式序列化
  //log首先打印ByteBuf数据
23:33:12 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ: 211B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 01 00 00 00 00 00 00 ff 00 00 00 c3 |................|
|00000010| ac ed 00 05 73 72 00 25 63 6e 2e 69 74 63 61 73 |....sr.%cn.itcas|
|00000020| 74 2e 6d 65 73 73 61 67 65 2e 4c 6f 67 69 6e 52 |t.message.LoginR|
|00000030| 65 71 75 65 73 74 4d 65 73 73 61 67 65 a0 3f 71 |equestMessage.?q|
|00000040| cb 31 45 b5 88 02 00 02 4c 00 08 70 61 73 73 77 |.1E.....L..passw|
|00000050| 6f 72 64 74 00 12 4c 6a 61 76 61 2f 6c 61 6e 67 |ordt..Ljava/lang|
|00000060| 2f 53 74 72 69 6e 67 3b 4c 00 08 75 73 65 72 6e |/String;L..usern|
|00000070| 61 6d 65 71 00 7e 00 01 78 72 00 19 63 6e 2e 69 |ameq.~..xr..cn.i|
|00000080| 74 63 61 73 74 2e 6d 65 73 73 61 67 65 2e 4d 65 |tcast.message.Me|
|00000090| 73 73 61 67 65 0b 0b f8 b3 48 3e 94 55 02 00 02 |ssage....H>.U...|
|000000a0| 49 00 0b 6d 65 73 73 61 67 65 54 79 70 65 49 00 |I..messageTypeI.|
|000000b0| 0a 73 65 71 75 65 6e 63 65 49 64 78 70 00 00 00 |.sequenceIdxp...|
|000000c0| 00 00 00 00 00 74 00 04 33 34 35 36 74 00 04 6c |.....t..3456t..l|
|000000d0| 69 73 69                                        |isi             |
+--------+-------------------------------------------------+----------------+
  //进行反序列化
使用Java方式反序列化
23:33:12 [DEBUG] [main] c.i.p.MessageCodecSharable - LoginRequestMessage(super=Message(sequenceId=0, messageType=0), username=lisi, password=3456)
  //log打印原始对象
23:33:12 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ: LoginRequestMessage(super=Message(sequenceId=0, messageType=0), username=lisi, password=3456)
```

### 2、参数调优

**`CONNECT_TIMEOUT_MILLIS`**

- 属于 `SocketChannal` 的参数
- 用在客户端建立连接时，如果在指定毫秒内无法连接，会抛出 `timeout` 异常，这个`timeout`异常是`Netty`中的异常
- 参数应该设置多大？如果太小的话，由于网络情况不是很好，那么还没来得及连接，就直接抛出`timeout`异常了，所以我们设置的大一点，保证客户端有足够的时间去尝试连接服务器
- 时间设置太大的话，如果服务器本来就是不可用的话，那么客户端不会等到设置的时间再抛出`timeout`异常，会检测服务器不可用之后，直接抛出更底层的`java.net.ConnectException`异常，客户端会`catch`该异常，然后抛出，所以不会抛出`timeout`异常。
- 所以如果想处理该异常，不要只`catch` `timeout`异常或者是`ConnectException`异常，应该直接`catch` `Exception`异常。
- 注意：`Netty` 中不要用成了`SO_TIMEOUT`，`SO_TIMEOUT`主要用在阻塞 `IO`，而 `Netty` 是非阻塞 `IO`

```java
public class TestParam {
    public static void main(String[] args) {
      // 客户端
        // SocketChannel 5s内未建立连接就抛出异常
        new Bootstrap().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);
      // 服务器端
        // ServerSocketChannel 5s内未建立连接就抛出异常
        new ServerBootstrap().option(ChannelOption.CONNECT_TIMEOUT_MILLIS,5000);
        // SocketChannel 5s内未建立连接就抛出异常
        new ServerBootstrap().childOption(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000);
    }
}
```

- 客户端通过 `Bootstrap.option` 函数来配置参数，配置参数作用于 `SocketChannel`
- 服务器通过`ServerBootstrap`来配置参数，但是对于不同的 `Channel` 需要选择不同的方法
  - 通过 `option` 来配置 `ServerSocketChannel` 上的参数
  - 通过 `childOption` 来配置 `SocketChannel` 上的参数

* **源码分析**

客户端中连接服务器的线程是 `NIO` 线程，抛出异常的是主线程。这是如何做到超时判断以及线程通信的呢？

在`AbstractNioChannel.AbstractNioUnsafe.connect`方法中：

```java
public final void connect(
                final SocketAddress remoteAddress, final SocketAddress localAddress, final ChannelPromise promise) {
    
    ...
        
    // Schedule connect timeout.
    // 设置超时时间，通过option方法传入的CONNECT_TIMEOUT_MILLIS参数进行设置
    int connectTimeoutMillis = config().getConnectTimeoutMillis();
    // 如果超时时间大于0
    if (connectTimeoutMillis > 0) {
        // 创建一个定时任务，延时connectTimeoutMillis（设置的超时时间时间）后执行
        // schedule(Runnable command, long delay, TimeUnit unit)
        connectTimeoutFuture = eventLoop().schedule(new Runnable() {
            @Override
            public void run() {
                // 判断是否建立连接，Promise进行NIO线程与主线程之间的通信
                // 如果超时，则通过tryFailure方法将异常放入Promise中
                // 在主线程中抛出
                ChannelPromise connectPromise = AbstractNioChannel.this.connectPromise;// 这个和主线程的future是同一个对象
                ConnectTimeoutException cause = new ConnectTimeoutException("connection timed out: " + remoteAddress);
                if (connectPromise != null && connectPromise.tryFailure(cause)) {
                    close(voidPromise());
                }
            }
        }, connectTimeoutMillis, TimeUnit.MILLISECONDS);
    }
    
   	...
        
}
```

超时的判断主要是通过 `Eventloop` 的 `schedule` 方法和 `Promise` 共同实现的

- `schedule` 设置了一个定时任务，延迟`connectTimeoutMillis`秒后执行该方法
- 如果指定时间内没有建立连接，则会执行其中的任务
  - 任务负责创建 `ConnectTimeoutException` 异常，并将异常通过 `Pormise` 传给主线程并抛出

**`SO_BACKLOG`**

* 该参数是 `ServerSocketChannel` 的参数

* **三次握手与连接队列**

第一次握手时，因为客户端与服务器之间的连接还未完全建立，连接会被放入半连接队列中



当完成三次握手以后，连接会被放入全连接队列中

服务器处理`Accept`事件是在`TCP`三次握手，也就是建立连接之后。服务器会从全连接队列中获取连接并进行处理

三次握手的完整图如下：

在 `linux 2.2` 之前，`backlog` 大小包括了两个队列的大小，在 `linux 2.2` 之后，分别用下面两个参数来控制

- 半连接队列 - `sync queue`
  - 大小通过 `/proc/sys/net/ipv4/tcp_max_syn_backlog` 指定，在 `syncookies` 启用的情况下，逻辑上没有最大值限制，这个设置便被忽略
- 全连接队列 - `accept queue`
  - 其大小通过 `/proc/sys/net/core/somaxconn` 指定，在使用 `listen` 函数时，内核会根据传入的 `backlog` 参数与系统参数，取二者的较小值
  - 如果 `accpet queue` 队列满了，`server` 将发送一个拒绝连接的错误信息到 `client`
- 参考
  - https://juejin.cn/post/7157182123441389604
  - https://cloud.tencent.com/developer/article/1699886

在`Netty`中，`SO_BACKLOG`主要用于设置全连接队列的大小。当处理`Accept`的速率小于连接建立的速率时，全连接队列中堆积的连接数大于`SO_BACKLOG`设置的值时，便会抛出异常，设置方式如下：

```java
// 设置全连接队列，大小为2
new ServerBootstrap().option(ChannelOption.SO_BACKLOG, 2);
```

> 如何进行演示？提供一种思路就是在`Netty`的源码中进行`accept`的时候直接打上断点，让其无法向下执行，此时全连接队列满，客户端再次连接服务器就会抛出一个拒绝连接的异常。

如果不指定的话，`Netty`会给一个默认值，那么怎么找到这个默认值呢？

首先说明：`backlog`参数在`NioServerSocketChannel.doBind`方法被使用

```java
@Override
protected void doBind(SocketAddress localAddress) throws Exception {
    if (PlatformDependent.javaVersion() >= 7) {
      // 使用到了一个默认的backlog参数
        javaChannel().bind(localAddress, config.getBacklog());
    } else {
        javaChannel().socket().bind(localAddress, config.getBacklog());
    }
}
```

```java
// 接口
private final ServerSocketChannelConfig config;
// ServerSocketChannelConfig是一个接口
public interface ServerSocketChannelConfig extends ChannelConfig{
  ...
}
// 找到其实现类
public class DefaultServerSocketChannelConfig extends DefaultChannelConfig
                                              implements ServerSocketChannelConfig {
  ...
}
// 在实现类中找到实现的getBacklog方法即可
private volatile int backlog = NetUtil.SOMAXCONN;
```

```java
// As a SecurityManager may prevent reading the somaxconn file we wrap this in a privileged block.
//
// See https://github.com/netty/netty/issues/3680
SOMAXCONN = AccessController.doPrivileged(new PrivilegedAction<Integer>() {
    @Override
    public Integer run() {
        // Determine the default somaxconn (server socket backlog) value of the platform.
        // The known defaults:
        // - Windows NT Server 4.0+: 200
        // - Linux and Mac OS X: 128
        int somaxconn = PlatformDependent.isWindows() ? 200 : 128;
        File file = new File("/proc/sys/net/core/somaxconn");
        BufferedReader in = null;
        try {
            // file.exists() may throw a SecurityException if a SecurityManager is used, so execute it in the
            // try / catch block.
            // See https://github.com/netty/netty/issues/4936
            if (file.exists()) {
                in = new BufferedReader(new FileReader(file));
              // 如果在系统文件中找到就用系统文件的somaxconn，即全连接队列的大小
                somaxconn = Integer.parseInt(in.readLine());
                if (logger.isDebugEnabled()) {
                    logger.debug("{}: {}", file, somaxconn);
                }
            } else {
                // Try to get from sysctl
                Integer tmp = null;
                if (SystemPropertyUtil.getBoolean("io.netty.net.somaxconn.trySysctl", false)) {
                    tmp = sysctlGetInt("kern.ipc.somaxconn");
                    if (tmp == null) {
                        tmp = sysctlGetInt("kern.ipc.soacceptqueue");
                        if (tmp != null) {
                            somaxconn = tmp;
                        }
                    } else {
                        somaxconn = tmp;
                    }
                }

                if (tmp == null) {
                    logger.debug("Failed to get SOMAXCONN from sysctl and file {}. Default: {}", file,
                                 somaxconn);
                }
            }
        } catch (Exception e) {
            logger.debug("Failed to get SOMAXCONN from sysctl and file {}. Default: {}", file, somaxconn, e);
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (Exception e) {
                    // Ignored.
                }
            }
        }
      // 返回somaxconn
        return somaxconn;
    }
});
```

从上面的源码中可以看出，`backlog`的值会根据操作系统的不同，来选择不同的默认值

- `Windows 200`
- `Linux/Mac OS 128`
- 如果配置文件`/proc/sys/net/core/somaxconn`存在，会读取配置文件中的值，并将`backlog`的值设置为配置文件中指定的

**`TCP_NODELAY`**

- 属于 `SocketChannal` 参数
- 因为 `Nagle` 算法，数据包会堆积到一定的数量后一起发送，这就可能导致数据的发送存在一定的延时
- 该参数默认为`false`，也就是默认启用了`Nagle`算法，如果不希望发送被延时，则需要将该值设置为`true`

**`SO_SNDBUF & SO_RCVBUF`**

- `SO_SNDBUF` 属于 `SocketChannal` 参数
- `SO_RCVBUF` 既可用于 `SocketChannal` 参数，也可以用于 `ServerSocketChannal` 参数（建议设置到 `ServerSocketChannal` 上）
- 该参数用于指定接收方与发送方的滑动窗口大小

**`ALLOCATOR`**

- 属于 `SocketChannal` 参数
- 用来配置 `ByteBuf` 是池化还是非池化，是直接内存还是堆内存

```java
// 选择ALLOCATOR参数，设置SocketChannel中分配的ByteBuf类型
// 第二个参数需要传入一个ByteBufAllocator，用于指定生成的 ByteBuf 的类型
new ServerBootstrap().childOption(ChannelOption.ALLOCATOR, new PooledByteBufAllocator());
```

* `ByteBufAllocator`类型

  * 池化并使用直接内存

  ```java
  // true表示使用直接内存
  new PooledByteBufAllocator(true);
  ```

  * 池化并使用堆内存

  ```java
  // false表示使用堆内存
  new PooledByteBufAllocator(false);
  ```

  * 非池化并使用直接内存

  ```java
  // ture表示使用直接内存
  new UnpooledByteBufAllocator(true);
  ```

  * 非池化并使用堆内存

  ```java
  // false表示使用堆内存
  new UnpooledByteBufAllocator(false);
  ```

**`RCVBUF_ALLOCATOR`**

- 属于 `SocketChannal` 参数
- 控制 `Netty` 接收缓冲区大小
- 负责入站数据的分配，决定入站缓冲区的大小（并可动态调整），统一采用 `direct` 直接内存，具体池化还是非池化由 `allocator` 决定











### 3、RPC框架

















### 4、项目代码

> https://gitee.com/oucystong/netty-chat.git

## 二、源码









## 三、参考

* https://nyimac.gitee.io/2021/04/25/Netty%E5%9F%BA%E7%A1%80/
* https://www.bilibili.com/video/BV1py4y1E7oA/
