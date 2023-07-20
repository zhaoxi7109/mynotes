---
title: Netty核心
# 当前页面图标
icon: write
# 分类
category:
  - Netty
  - 网络编程
# 标签
tag:
  - 服务器
  - 客户端
  - 组件
  - 协议设计
  - 粘包半包
sticky: false
# 是否收藏在博客主题的文章列表中，当填入数字时，数字越大，排名越靠前。
star: false
# 是否将该文章添加至文章列表中
article: true
# 是否将该文章添加至时间线中
timeline: true
---

## 一、概述

### 1、什么是Netty

```java
Netty is an asynchronous event-driven network application framework for rapid development of maintainable high performance protocol servers & clients.
```

* `Netty` 是一个**异步的、基于事件驱动**的网络应用框架，用于快速开发可维护、高性能的网络服务器和客户端。

> 注意：`Netty`的异步还是基于多路复用的，并没有实现真正意义上的异步`IO`

### 2、Netty的优势

**如果使用传统`NIO`，其工作量大，`Bug` 多**

- 需要自己构建协议
- 解决 `TCP` 传输问题，如粘包、半包
- 因为`bug`的存在，`epoll` 空轮询导致 `CPU` 100%

**`Netty` 对 `API` 进行增强，使之更易用，如**

- `FastThreadLocal` => `ThreadLocal`
- `ByteBuf` => `ByteBuffer`

**相比于其他网络应用框架**

* `Mina` 由 `Apache` 维护，将来 `3.x` 版本可能会有较大重构，破坏 `API` 向下兼容性，**`Netty` 的开发迭代更迅速，`API` 更简洁**
* `Netty` 久经考验，经历多年，很多`Bug`问题已经被修复，`Netty` 版本的迭代过程如下：
  * `2.x 2004`
  * `3.x 2008`
  * **`4.x 2013（常用）`**
  * `5.x 已废弃（没有明显的性能提升，维护成本高）`

### 3、Netty的地位

`Netty` 在 `Java` 网络应用框架中的地位就好比 `Spring` 框架在 `JavaEE` 开发中的地位。

**总之一句话：只要有网络通信需求的框架都用到了`Netty`。**

### 4、Netty的作者



> 他还是另一个著名网络应用框架 `Mina` 的重要贡献者

## 二、入门案例

### 1、需求

开发一个简单的服务器端和客户端：

* 客户端向服务器端发送 `hello world`
* 服务器仅接收输出到控制台，不返回

添加依赖：

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.39.Final</version>
</dependency>
```

### 2、服务器端代码

```java
public class HelloServer {
    public static void main(String[] args) {
        // 1、启动器，负责装配netty组件，启动服务器
        new ServerBootstrap()
                // 2、创建 NioEventLoopGroup，可以简单理解为 线程池 + Selector
                .group(new NioEventLoopGroup())
                // 3、选择服务器的 ServerSocketChannel 实现
                .channel(NioServerSocketChannel.class)
                // 4、child 负责处理读写，该方法决定了 child 执行哪些操作
                // ChannelInitializer 处理器（仅执行一次）
                // 它的作用是待客户端SocketChannel建立连接后，执行initChannel以便添加更多的处理器
                .childHandler(new ChannelInitializer<NioSocketChannel>() {
                    @Override
                    protected void initChannel(NioSocketChannel nioSocketChannel) throws Exception {
                        // 5、SocketChannel的处理器，使用StringDecoder解码，ByteBuf=>String
                        nioSocketChannel.pipeline().addLast(new StringDecoder());
                        // 6、SocketChannel的业务处理，使用上一个处理器的处理结果
                        nioSocketChannel.pipeline().addLast(new SimpleChannelInboundHandler<String>() {
                            @Override
                            protected void channelRead0(ChannelHandlerContext channelHandlerContext, String s) throws Exception {
                                System.out.println(s);
                            }
                        });
                    }
                    // 7、ServerSocketChannel绑定8080端口
                }).bind(8080);
    }
}

```

* 第二步说明：

事件循环组中有多个事件循环对象，专门用于处理`accept`、`read`等事件，一个事件循环对象可以认为就是一个线程配合一个`selector`工作，可以管理多个`channel`。

```java
public NioEventLoopGroup() {
  //默认传入线程数为0
    this(0);
}
public NioEventLoopGroup(int nThreads) {
  //传入指定的线程数
    this(nThreads, (Executor) null);
}
```

可以传入一个参数，代表线程数，如果不传入，也至少会保证一个线程。

```java
private static final int DEFAULT_EVENT_LOOP_THREADS;

static {
  //至少保证一个线程
    DEFAULT_EVENT_LOOP_THREADS = Math.max(1, SystemPropertyUtil.getInt(
      //核心数的2倍作为线程数
            "io.netty.eventLoopThreads", NettyRuntime.availableProcessors() * 2));

    if (logger.isDebugEnabled()) {
        logger.debug("-Dio.netty.eventLoopThreads: {}", DEFAULT_EVENT_LOOP_THREADS);
    }
}

/**
 * @see MultithreadEventExecutorGroup#MultithreadEventExecutorGroup(int, Executor, Object...)
 */
//三元运算，如果是0，则使用默认的线程数（可以至少保证一个线程），否则使用用户指定的线程数
protected MultithreadEventLoopGroup(int nThreads, Executor executor, Object... args) {
    super(nThreads == 0 ? DEFAULT_EVENT_LOOP_THREADS : nThreads, executor, args);
}

```

* 第三步说明：

选择服务器的`ServerSocketChannel`实现，上述选中了基于`NIO`的服务器实现，还有其他的实现，如下图

* 第四步说明：

方法名叫做`chindHandler`是因为接下来添加的处理器都是给 `SocketChannel` 用的，而不是给 `ServerSocketChannel`。

> `IDEA`中重写方法快捷键：`Control+O`

### 3、客户端代码

```java
public class HelloClient {
    public static void main(String[] args) throws InterruptedException {
        new Bootstrap()
                .group(new NioEventLoopGroup())
                // 选择客户 Socket 实现类，NioSocketChannel 表示基于 NIO 的客户端实现
                .channel(NioSocketChannel.class)
                // ChannelInitializer 处理器（仅执行一次）
                // 它的作用是待客户端SocketChannel建立连接后，执行initChannel以便添加更多的处理器
                .handler(new ChannelInitializer<Channel>() {
                    @Override
                    protected void initChannel(Channel channel) throws Exception {
                        // 消息会经过通道 handler 处理，这里是将 String => ByteBuf 编码发出
                        channel.pipeline().addLast(new StringEncoder());
                    }
                })
                // 指定要连接的服务器和端口
                .connect(new InetSocketAddress("localhost", 8080))
                // Netty 中很多方法都是异步的，如 connect
                // 这时需要使用 sync 方法等待 connect 建立连接完毕 【sync:同步】【async：异步】
                .sync()
                // 获取 channel 对象，它即为通道抽象，可以进行数据读写操作
                .channel()
                // 写入消息并清空缓冲区
                .writeAndFlush("hello world");
    }
}
```

* 第二步：

选择客户端的`SocketChannel`实现，上述选中了基于`NIO`的客户端实现，还有其他的实现，如下图：



> **IDEA中多开客户端：**
>
> 

### 4、运行流程

**左：客户端 右：服务器端**



* 服务器端启动之后，会绑定`8080`端口并进行监听，同时启动事件循环组监听`channel`上的事件。
* 客户端启动之后，连接服务器端的`8080`端口，服务器端的事件循环组监听到`ServerSocketChannel`上的`accept`事件并进行处理。
* 客户端会阻塞，直到连接建立之后，服务器端和客户端分别初始化`SocketChannel`。
* 客户端获得`SocketChannel`并且写入数据，客户端的处理器会将字符串转为`ByteBuf`进行传输，在`SocketChannel`中传输的都是`ByteBuf`数据。
* 服务器端的事件循环组监听到某个`SocketChannel`的`read`事件，由某个`EventLoop`处理`read`事件，接收到了`ByteBuf`数据。
* 服务器端的处理器依次对接受到的数据进行处理。

### 5、组件解释

- `channel` 可以理解为**数据的通道**
- `msg` 理解为流动的数据，最开始输入是 `ByteBuf`，但经过 `pipeline` 中的各个 `handler` 加工，会变成其它类型对象，最后输出又变成 `ByteBuf`
- `handler` 可以理解为数据的处理工序
  - **工序有多道，合在一起就是 `pipeline`（流水线），`pipeline` 负责发布事件（读、读取完成…）传播给每个 `handler`， `handler` 对自己感兴趣的事件进行处理（重写了相应事件处理方法）**
    - `pipeline` 中有多个 `handler`，处理时会依次调用其中的 `handler`
  - **`handler` 分 `Inbound` 和 `Outbound` 两类**
    - `Inbound` 入站
    - `Outbound` 出站
- `eventLoop` 可以理解为**处理数据的工人**
  - `eventLoop` 可以管理多个 `channel` 的 `io` 操作，并且一旦 `eventLoop` 负责了某个 `channel`，就**会将其与`channel`进行绑定**，以后该 `channel` 中的 `io` 操作都由该 `eventLoop` 负责
  - `eventLoop` 既可以执行 `io` 操作，**也可以进行任务处理**，每个 `eventLoop` 有自己的任务队列，队列里可以堆放多个 `channel` 的待处理任务，任务分为普通任务、定时任务
  - `eventLoop` 按照 `pipeline` 顺序，依次按照 `handler` 的规划（代码）处理数据，**可以为每个 `handler` 指定不同的 `eventLoop`**

## 三、组件

### 1、EventLoop

> **事件循环对象** `EventLoop`

`EventLoop` 本质是一个**单线程执行器（同时维护了一个 `Selector`），里面有 `run` 方法处理一个或多个 `Channel` 上源源不断的 `io` 事件**

它的继承关系如下：

- 继承自 `j.u.c.ScheduledExecutorService` 因此包含了线程池中所有的方法
- 继承自 `Netty` 自己的 `OrderedEventExecutor`
  - 提供了 `boolean inEventLoop(Thread thread)` 方法判断一个线程是否属于此 `EventLoop`
  - 提供了 `EventLoopGroup parent()` 方法来看看自己属于哪个 `EventLoopGroup`

> **事件循环组** `EventLoopGroup`

`EventLoopGroup` 是一组 `EventLoop`，`Channel` 一般会调用 `EventLoopGroup` 的 `register` 方法来**绑定其中一个 `EventLoop`，后续这个 `Channel` 上的 `io` 事件都由此 `EventLoop` 来处理（保证了 `io` 事件处理时的线程安全）**

- 继承自 `Netty` 自己的 `EventExecutorGroup`
  - 实现了 `Iterable` 接口提供遍历 `EventLoop` 的能力
  - 另有 `next` 方法获取集合中下一个 `EventLoop`

> `EventLoopGroup`有多个类型，都继承自`MultithreadEventLoopGroup`（多线程事件循环组）抽象类。



**一般使用`NioEventLoopGroup`（处理`io`事件、普通任务、定时任务），而`DefaultEventLoopGroup`只能处理普通任务和定时任务。**

> `EventLoopGroup`继承关系



#### 1、处理普通任务和定时任务

```java
public class TestEventLoop {
    public static void main(String[] args) throws InterruptedException {
        // 创建拥有两个EventLoop的NioEventLoopGroup，对应两个线程
        EventLoopGroup group = new NioEventLoopGroup(2);
        // 通过next方法可以获得下一个 EventLoop
        System.out.println(group.next());
        System.out.println(group.next());
        System.out.println(group.next());
        System.out.println(group.next());

        // 通过EventLoop执行普通任务，可以用来执行耗时较长的任务
        group.next().execute(() -> {
            System.out.println(Thread.currentThread().getName() + "->执行普通任务");
        });

        // 通过EventLoop执行定时任务
        group.next().scheduleAtFixedRate(() -> {
            System.out.println(Thread.currentThread().getName() + "->执行定时任务");
        }, 0, 1, TimeUnit.SECONDS);

        //当前线程睡眠4秒钟，让EventLoop中的线程执行定时任务
        Thread.sleep(4000);

        // 优雅地关闭
        group.shutdownGracefully();
    }
}
```

执行结果：

```java
io.netty.channel.nio.NioEventLoop@53e25b76
io.netty.channel.nio.NioEventLoop@73a8dfcc
io.netty.channel.nio.NioEventLoop@53e25b76
io.netty.channel.nio.NioEventLoop@73a8dfcc
nioEventLoopGroup-2-1->执行普通任务
nioEventLoopGroup-2-2->执行定时任务
nioEventLoopGroup-2-2->执行定时任务
nioEventLoopGroup-2-2->执行定时任务
nioEventLoopGroup-2-2->执行定时任务
nioEventLoopGroup-2-2->执行定时任务
```

通过上述结果可以看出`NioEventLoopGroup`中的线程数为2，所以有两个`EventLoop`，每一个`EventLoop`都是一个线程配合一个`selector`进行工作，并且通过`next`方法实现了简单的轮询。

**关闭 EventLoopGroup**

> 优雅关闭 `shutdownGracefully` 方法，该方法会首先切换 `EventLoopGroup` 到关闭状态从而拒绝新的任务的加入，然后在任务队列的任务都处理完成后，停止线程的运行，从而确保整体应用是在正常有序的状态下退出的。

#### 2、处理IO任务

**服务器代码**

```java
public class MyServer {
    public static void main(String[] args) {
        new ServerBootstrap()
                .group(new NioEventLoopGroup())
                .channel(NioServerSocketChannel.class)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        //添加一个处理器
                        socketChannel.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                            @Override
                            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                                //channel中接受到的数据
                                ByteBuf buf = (ByteBuf) msg;
                                //打印客户端发送过来的数据
                                System.out.println(Thread.currentThread().getName() + " " + buf.toString(StandardCharsets.UTF_8));

                            }
                        });
                    }
                })
                .bind(8080);
    }
}
```

**客户端代码**

```java
public class MyClient {
    public static void main(String[] args) throws IOException, InterruptedException {
        Channel channel = new Bootstrap()
                .group(new NioEventLoopGroup())
                .channel(NioSocketChannel.class)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                      //添加处理器：将字符串转为ByteBuf在channel中进行传输
                        socketChannel.pipeline().addLast(new StringEncoder());
                    }
                })
                .connect(new InetSocketAddress("localhost", 8080))
                .sync()//阻塞直到建立连接
                .channel();//获得当前客户端和服务器传输的channel
        System.out.println(channel);
        // 此处打断点调试，调用 channel.writeAndFlush(...);
        System.in.read();
    }
}
```

> 添加断点之后，向服务器发送数据，会发现服务器端收不到消息，这是因为IDEA中的断点默认会阻塞所有的线程，客户端代码中的main线程和NioEventLoopGroup中的线程都会被阻塞，服务器自然就收不到服务器端发送的数据了。**正确的做法应该是可以阻塞main线程，其他的线程可以正常执行。**
>
> 按照下图修改断点的设置，使其只能阻塞当前main线程，其他线程正常执行：
>
> Breakpoint Suspend 参数介绍：在创建断点时有一个重要参数是Suspend。
>
> Suspend：未勾选，程序运行到断点处并不会阻塞，而会继续执行后面的逻辑。
>
> Suspend：勾选，代表程序运行到断点处会阻塞。
>
> \+ All：勾选，代表断点会阻塞所有线程。
>
> \+ Thread：勾选，代表断点只会阻塞当前线程。
>
> [Suspend勾选，All勾选] 是默认值，所以才会出现 “Stop The World” 的可怕情况。
>
> **所以说，在多线程调试时，若你希望阻塞程序，最好选择 Thread 当前线程阻塞策略，这样就不会影响到其他线程的工作。**

打开三个客户端分别给服务器发送数据，查看服务器端接收到的数据如下：

```java
nioEventLoopGroup-2-3 我是客户端1的数据
nioEventLoopGroup-2-4 我是客户端2的数据
nioEventLoopGroup-2-5 我是客户端3的数据
  //三个客户端分别被不同的线程处理IO事件，当服务器端的线程数用完之后，就会实现轮询，实现一个线程操作多个客户端，配合线程的selector会管理多个客户端的SocketChannel
nioEventLoopGroup-2-3 我是客户端1的数据
nioEventLoopGroup-2-3 我是客户端1的数据
nioEventLoopGroup-2-5 我是客户端3的数据
nioEventLoopGroup-2-5 我是客户端3的数据
nioEventLoopGroup-2-4 我是客户端2的数据
nioEventLoopGroup-2-4 我是客户端2的数据
  //线程和客户端实现了绑定，对于某一个客户端，第一次由哪个线程处理的IO事件，以后的IO事件都会由该线程进行处理，保证了数据安全性
```

#### 3、实现分工

ServerBootstrap的group()方法**可以传入两个EventLoopGroup参数**，分别负责处理不同的事件。

```java
public class MyServer {
    public static void main(String[] args) {
        new ServerBootstrap()
            	// 两个Group，分别为Boss 负责Accept事件，Worker 负责读写事件
                .group(new NioEventLoopGroup(1), new NioEventLoopGroup(2))
            
				...
    }
}
```

打开四个客户端分别给服务器发送数据，查看服务器端接收到的数据如下：

```java
nioEventLoopGroup-3-1 客户端1的数据
nioEventLoopGroup-3-2 客户端2的数据
nioEventLoopGroup-3-1 客户端3的数据
nioEventLoopGroup-3-2 客户端4的数据
  //group中的第2个参数设置了两个线程，该线程负责读写事件，并且在多客户端下实现了轮询，而第一个参数是负责客户端的accept事件
nioEventLoopGroup-3-1 客户端1的数据
nioEventLoopGroup-3-1 客户端3的数据
  //实现了线程和客户端的绑定，保证了数据安全性
```

可以看出，一个EventLoop可以**负责多个**Channel，且EventLoop一旦与Channel绑定，则**一直负责**处理该Channel中的事件。

#### 4、更换EventLoopGroup

当有的**任务需要较长的时间处理时，可以使用非NioEventLoopGroup**，避免同一个NioEventLoop中的其他Channel在较长的时间内都无法得到处理。

```java
public class MyServer {
    public static void main(String[] args) {
        // 增加自定义的非NioEventLoopGroup
        EventLoopGroup group = new DefaultEventLoopGroup(2);

        new ServerBootstrap()
                //一个Boss 负责accept事件 两个Worker 负责读写事件
                .group(new NioEventLoopGroup(1), new NioEventLoopGroup(2))
                .channel(NioServerSocketChannel.class)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        // 增加两个handler，第一个使用NioEventLoopGroup处理，第二个使用自定义EventLoopGroup处理
                        socketChannel.pipeline().addLast("NioHandler", new ChannelInboundHandlerAdapter() {
                            @Override
                            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                                ByteBuf buf = (ByteBuf) msg;
                                System.out.println(Thread.currentThread().getName() + " " + buf.toString(StandardCharsets.UTF_8));
                                // 调用下一个handler
                                ctx.fireChannelRead(msg);
                            }
                        })
                                // 该handler绑定自定义的Group
                                .addLast(group, "MyDefaultHandler", new ChannelInboundHandlerAdapter() {
                                    @Override
                                    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                                        ByteBuf buf = (ByteBuf) msg;
                                        System.out.println(Thread.currentThread().getName() + " " + buf.toString(StandardCharsets.UTF_8));
                                    }
                                });
                    }
                })
                .bind(8080);
    }
}
```

打开四个客户端分别给服务器发送数据，查看服务器端接收到的数据如下：

```java
nioEventLoopGroup-4-2 客户端1的数据
defaultEventLoopGroup-2-2 客户端1的数据
  //客户端1
nioEventLoopGroup-4-1 客户端2的数据
defaultEventLoopGroup-2-1 客户端2的数据
  //客户端2
nioEventLoopGroup-4-2 客户端3的数据
defaultEventLoopGroup-2-2 客户端3的数据
  //客户端3
nioEventLoopGroup-4-1 客户端4的数据
defaultEventLoopGroup-2-1 客户端4的数据
  //客户端4
nioEventLoopGroup-4-2 客户端1的数据
defaultEventLoopGroup-2-2 客户端1的数据
  //客户端1
```

可以看出，客户端与服务器之间的read事件中，不同的handler被nioEventLoopGroup和defaultEventLoopGroup分别处理，下一次客户端继续发送消息，仍然由原来的线程操作IO事件和相应任务，保证了数据的安全性。



#### 5、换工人原理

**不同的EventLoopGroup切换的实现原理如下**：当handler中绑定的Group不同时，需要切换Group来执行不同的任务。

关键代码 `io.netty.channel.AbstractChannelHandlerContext#invokeChannelRead()`

```java
static void invokeChannelRead(final AbstractChannelHandlerContext next, Object msg) {
    final Object m = next.pipeline.touch(ObjectUtil.checkNotNull(msg, "msg"), next);
    // 获得下一个EventLoop, excutor 即为 EventLoopGroup
    EventExecutor executor = next.executor();
    
    // 如果下一个EventLoop 在当前的 EventLoopGroup中
    if (executor.inEventLoop()) {
        // 使用当前 EventLoopGroup 中的 EventLoop 来处理任务
        next.invokeChannelRead(m);
    } else {
        // 否则让另一个 EventLoopGroup 中的 EventLoop 来创建任务并执行
        executor.execute(new Runnable() {
            public void run() {
                next.invokeChannelRead(m);
            }
        });
    }
}
```

- 如果两个 handler 绑定的是**同一个EventLoopGroup**，那么就直接调用
- 否则，把要调用的代码封装为一个任务对象，由下一个 handler 的 EventLoopGroup 来调用

### 2、Channel

Channel 的常用方法：

- close() 可以用来**关闭Channel**
- closeFuture() 用来**处理 Channel 的关闭**
  - sync 方法作用是**同步等待 Channel 关闭**
  - 而 addListener 方法是**异步等待 Channel 关闭**
- pipeline() 方法用于**添加处理器**
- write() 方法将数据写入
  - 因为缓冲机制，数据被写入到 Channel 中以后，不会立即被发送
  - **只有当缓冲满了或者调用了flush()方法后**，才会将数据通过 Channel 发送出去
- writeAndFlush() 方法将数据写入并**立即发送（刷出）**

#### 1、ChannelFuture

**连接问题**

客户端获得SocketChannel和发送数据的操作是在main线程中执行还是在NIO线程（NioEventLoop 中的线程）中执行？

**拆分客户端代码**

```java
public class MyClient {
    public static void main(String[] args) throws IOException, InterruptedException {
        ChannelFuture channelFuture = new Bootstrap()
                .group(new NioEventLoopGroup())
                .channel(NioSocketChannel.class)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        socketChannel.pipeline().addLast(new StringEncoder());
                    }
                })
                // 该方法为异步非阻塞方法，主线程调用后不会被阻塞，真正去执行连接操作的是NIO线程
                // NIO线程：NioEventLoop 中的线程
                .connect(new InetSocketAddress("localhost", 8080));

        // 该方法用于等待连接真正建立
        channelFuture.sync();

        // 获取客户端-服务器之间的Channel对象
        Channel channel = channelFuture.channel();
        channel.writeAndFlush(Thread.currentThread().getName() + "->客户端数据");
        System.in.read();
    }
}
```

如果去掉`channelFuture.sync()`方法，会服务器无法收到`main->客户端数据`，这是因为建立连接(connect)的过程是**异步非阻塞**的，这就意味着不等连接建立，方法执行就返回了。若不通过`sync()`方法阻塞主线程，等待连接真正建立，这时通过 channelFuture.channel() **拿到的 Channel 对象，并不是真正与服务器建立好连接的 Channel**，也就没法将信息正确的传输给服务器端。所以需要通过`channelFuture.sync()`方法，阻塞主线程，**同步处理结果**，等待连接真正建立好以后，再去获得 Channel 传递数据。使用该方法，获取 Channel 和发送数据的线程**都是主线程。**

下面还有一种`addListener`方法，用于**异步**获取建立连接后的 Channel 和发送数据，使得执行这些操作的线程是 NIO 线程：

```java
public class MyClient {
    public static void main(String[] args) throws IOException, InterruptedException {
        ChannelFuture channelFuture = new Bootstrap()
                .group(new NioEventLoopGroup())
                .channel(NioSocketChannel.class)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        socketChannel.pipeline().addLast(new StringEncoder());
                    }
                })
                // 该方法为异步非阻塞方法，主线程调用后不会被阻塞，真正去执行连接操作的是NIO线程
                // NIO线程：NioEventLoop 中的线程
                .connect(new InetSocketAddress("localhost", 8080));

        // 当connect方法执行完毕后，也就是连接真正建立后
        // 会在NIO线程中调用operationComplete方法
        channelFuture.addListener(new ChannelFutureListener() {
            @Override
            public void operationComplete(ChannelFuture channelFuture) throws Exception {
                Channel channel = channelFuture.channel();
                channel.writeAndFlush(Thread.currentThread().getName() + "->客户端数据");
            }
        });
        System.in.read();
    }
}
```

通过这种方法可以**在NIO线程中获取 Channel 并发送数据，**而不是在主线程中执行这些操作。

#### 2、CloseFuture

**处理关闭**

```java
public class ReadClient {
    public static void main(String[] args) throws InterruptedException {
        // 创建EventLoopGroup，使用完毕后关闭
        NioEventLoopGroup group = new NioEventLoopGroup();

        ChannelFuture channelFuture = new Bootstrap()
                .group(group)
                .channel(NioSocketChannel.class)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        //将字符串转为ByteBuf进行传输
                        socketChannel.pipeline().addLast(new StringEncoder());
                    }
                })
          //建立连接是在NIO线程中执行
                .connect(new InetSocketAddress("localhost", 8080));
        //阻塞->等待连接建立
        channelFuture.sync();
        //获得客户端->服务器的SocketChannel
        Channel channel = channelFuture.channel();
        //系统输入
        Scanner scanner = new Scanner(System.in);
        // 创建一个线程用于输入并向服务器发送
        new Thread(() -> {
            while (true) {
                String msg = scanner.next();
                if ("q".equals(msg)) {
                    // 关闭操作是异步的，在NIO线程中执行
                    channel.close();
                    break;
                }
                channel.writeAndFlush(Thread.currentThread().getName() + "--->" + msg);
            }
        }, "InputThread").start();

        // 获得closeFuture对象
        ChannelFuture closeFuture = channel.closeFuture();
        System.out.println("waiting close...");

        // 同步等待NIO线程执行完close操作
        closeFuture.sync();

        // 关闭之后执行一些操作，可以保证执行的操作一定是在channel关闭以后执行的
        System.out.println("SocketChannel关闭之后需要执行的操作...");

        // 关闭EventLoopGroup
        group.shutdownGracefully();
    }
}
```

当我们要关闭channel时，可以调用channel.close()方法进行关闭。但是该方法也是一个**异步方法**。真正的关闭操作并不是在调用该方法的线程中执行的，而是**在NIO线程中执行真正的关闭操作。**如果想在channel**真正关闭以后**，执行一些额外的操作，可以选择以下两种方法来实现：

* 通过channel.closeFuture()方法获得对应的ChannelFuture对象，然后调用**sync()方法**阻塞执行操作的线程，等待channel真正关闭后，再执行其他操作，**这些其他操作是在main线程中执行的。**

```java
// 获得closeFuture对象
ChannelFuture closeFuture = channel.closeFuture();

// 同步等待NIO线程执行完close操作
closeFuture.sync();

// 关闭之后执行一些操作，可以保证执行的操作一定是在channel关闭以后执行的
System.out.println(Thread.currentThread().getName());
```

* 调用**closeFuture.addListener**方法，添加close的后续操作，**这些操作是在NIO线程中完成的。**

```java
closeFuture.addListener(new ChannelFutureListener() {
    @Override
    public void operationComplete(ChannelFuture channelFuture) throws Exception {
        // 等待channel关闭后才执行的操作
        System.out.println(Thread.currentThread().getName());
        // 关闭EventLoopGroup
        group.shutdownGracefully();
    }
});
```

### 3、Future&Promise

#### 1、概念

> Netty 中的 Future 与 JDK 中的 Future 同名，但是是两个接口，Netty 的 Future 继承自 JDK 的 Future，而 Promise 又对 Netty Future 进行了扩展。

- JDK Future 只能同步等待任务结束（或成功、或失败）才能得到结果
- Netty Future 可以同步等待任务结束得到结果，也可以异步方式得到结果，但**都是要等任务结束**
- Netty Promise 不仅有 Netty Future 的功能，而且脱离了任务独立存在，**只作为两个线程间传递结果的容器**

| 功能/名称    | JDK Future                     | Netty Future                                                 | Netty Promise |
| ------------ | ------------------------------ | :----------------------------------------------------------- | ------------- |
| cancel       | 取消任务                       | -                                                            | -             |
| isCanceled   | 任务是否取消                   | -                                                            | -             |
| isDone       | 任务是否完成，不能区分成功失败 | -                                                            | -             |
| get          | 获取任务结果，阻塞等待         | -                                                            | -             |
| getNow       | -                              | 获取任务结果，非阻塞，还未产生结果时返回 null                | -             |
| await        | -                              | 等待任务结束，如果任务失败，不会抛异常，而是通过 isSuccess 判断 | -             |
| sync         | -                              | 等待任务结束，如果任务失败，抛出异常                         | -             |
| isSuccess    | -                              | 判断任务是否成功                                             | -             |
| cause        | -                              | 获取失败信息，非阻塞，如果没有失败，返回null                 | -             |
| addLinstener | -                              | 添加回调，异步接收结果                                       | -             |
| setSuccess   | -                              | -                                                            | 设置成功结果  |
| setFailure   | -                              | -                                                            | 设置失败结果  |

#### 2、JDK Future

```java
public class JdkFuture {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        ThreadFactory factory = new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "JdkFuture");
            }
        };
        // 创建线程池
        ThreadPoolExecutor executor = new ThreadPoolExecutor(5, 10, 10, TimeUnit.SECONDS, new ArrayBlockingQueue<>(10), factory);

        // 获得Future对象
        Future<Integer> future = executor.submit(new Callable<Integer>() {

            @Override
            public Integer call() throws Exception {
                TimeUnit.SECONDS.sleep(1);
                return 50;
            }
        });

        // 通过阻塞的方式，获得运行结果
        System.out.println(future.get());
    }
}
```

#### 3、Netty Future

```java
public class NettyFuture {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        NioEventLoopGroup group = new NioEventLoopGroup();

        // 获得 EventLoop 对象
        EventLoop eventLoop = group.next();
        Future<Integer> future = eventLoop.submit(new Callable<Integer>() {
            @Override
            public Integer call() throws Exception {
                return 50;
            }
        });

        // 主线程中获取结果
        future.sync();//等待任务结束，同步结果
        System.out.println(Thread.currentThread().getName() + "->获取结果");
        System.out.println("getNow->" + future.getNow());
        System.out.println("get->" + future.get());

        // NIO线程中异步获取结果
        future.addListener(new GenericFutureListener<Future<? super Integer>>() {
            @Override
            public void operationComplete(Future<? super Integer> future) throws Exception {
                System.out.println(Thread.currentThread().getName() + "->获取结果");
                System.out.println("getNow->" + future.getNow());
                System.out.println("get->" + future.get());
            }
        });
    }
}
```

Netty中的Future对象，可以通过EventLoop的sumbit()方法得到

- 可以通过Future对象的**get方法**，阻塞地获取返回结果
- 也可以通过**getNow方法**，获取结果，若还没有结果，则返回null，该方法是非阻塞的
- 还可以通过**future.addListener方法**，在Callable方法执行的线程中，异步获取返回结果

#### 4、Netty Promise

Promise相当于一个容器，可以用于存放各个线程中的结果，然后让其他线程去获取该结果。

```java
public class NettyPromise {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // 创建EventLoop
        NioEventLoopGroup group = new NioEventLoopGroup();
        EventLoop eventLoop = group.next();

        // 创建Promise对象，用于存放结果
        DefaultPromise<Integer> promise = new DefaultPromise<>(eventLoop);

        new Thread(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            // 自定义线程向Promise中存放结果
            promise.setSuccess(50);
        }).start();

        // 主线程从Promise中获取结果
        System.out.println(Thread.currentThread().getName() + "->" + promise.get());
    }
}
```

### 4、Handler&Pipeline

#### 1、Pipeline

```java
public class PipeLineServer {
    public static void main(String[] args) {
        new ServerBootstrap()
                .group(new NioEventLoopGroup())
                .channel(NioServerSocketChannel.class)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        // 在socketChannel的pipeline中添加handler
                        // pipeline中handler是带有head与tail节点的双向链表，其实际结构为
                        // head <-> handler1 <-> ... <-> handler4 <->tail
                        // Inbound主要处理入站操作，一般为读操作，发生入站操作时会触发Inbound方法
                        // 入站时，handler是从head向后调用的
                        socketChannel.pipeline().addLast("handler1", new ChannelInboundHandlerAdapter() {
                            @Override
                            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                                System.out.println(Thread.currentThread().getName() + " Inbound handler 1");
                                // 父类该方法内部会调用fireChannelRead
                                // 将数据传递给下一个handler
                                super.channelRead(ctx, msg);
                            }
                        });
                        socketChannel.pipeline().addLast("handler2", new ChannelInboundHandlerAdapter() {
                            @Override
                            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                                System.out.println(Thread.currentThread().getName() + " Inbound handler 2");
                                // 执行write操作，使得Outbound的方法能够得到调用
                                socketChannel.writeAndFlush(ctx.alloc().buffer().writeBytes("Server...".getBytes(StandardCharsets.UTF_8)));
                                super.channelRead(ctx, msg);
                            }
                        });
                        // Outbound主要处理出站操作，一般为写操作，发生出站操作时会触发Outbound方法
                        // 出站时，handler的调用是从tail向前调用的
                        socketChannel.pipeline().addLast("handler3", new ChannelOutboundHandlerAdapter() {
                            @Override
                            public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
                                System.out.println(Thread.currentThread().getName() + " Outbound handler 1");
                                super.write(ctx, msg, promise);
                            }
                        });
                        socketChannel.pipeline().addLast("handler4", new ChannelOutboundHandlerAdapter() {
                            @Override
                            public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
                                System.out.println(Thread.currentThread().getName() + " Outbound handler 2");
                                super.write(ctx, msg, promise);
                            }
                        });
                    }
                })
                .bind(8080);
    }
}
```

运行结果：

```java
nioEventLoopGroup-2-2 Inbound handler 1
nioEventLoopGroup-2-2 Inbound handler 2
nioEventLoopGroup-2-2 Outbound handler 2
nioEventLoopGroup-2-2 Outbound handler 1
```

通过channel.pipeline().addLast(name, handler)添加handler时，**记得给handler取名字**。这样可以调用pipeline的**addAfter、addBefore等方法更灵活地向pipeline中添加handler**

handler需要放入channel的pipeline中，才能根据放入顺序来使用handler

- pipeline的结构是一个带有head与tail指针的双向链表，其中的节点为handler
  - 要通过ctx.fireChannelRead(msg)等方法，**将当前handler的处理结果传递给下一个handler**
- 当有**入站**（Inbound）操作时，会从**head开始向后**调用handler，直到handler不是处理Inbound操作为止
- 当有**出站**（Outbound）操作时，会从**tail开始向前**调用handler，直到handler不是处理Outbound操作为止

**具体结构如下：**



**调用顺序如下：**

#### 2、OutboundHandler

* **socketChannel.writeAndFlush()**

当handler中调用该方法进行写操作时，会触发Outbound操作，**此时是从tail向前寻找OutboundHandler**



* **ctx.writeAndFlush()**

当handler中调用该方法进行写操作时，会触发Outbound操作，**此时是从当前handler向前寻找OutboundHandler**



#### 3、EmbeddedChannel

EmbeddedChannel可以用于测试各个handler，通过其构造函数按顺序传入需要测试的handler，然后调用对应的Inbound和Outbound方法即可。

```java
public class TestEmbeddedChannel {
    public static void main(String[] args) {
        ChannelInboundHandlerAdapter h1 = new ChannelInboundHandlerAdapter() {
            @Override
            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                System.out.println("1");
                super.channelRead(ctx, msg);
            }
        };

        ChannelInboundHandlerAdapter h2 = new ChannelInboundHandlerAdapter() {
            @Override
            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                System.out.println("2");
                super.channelRead(ctx, msg);
            }
        };

        ChannelOutboundHandlerAdapter h3 = new ChannelOutboundHandlerAdapter() {
            @Override
            public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
                System.out.println("3");
                super.write(ctx, msg, promise);
            }
        };

        ChannelOutboundHandlerAdapter h4 = new ChannelOutboundHandlerAdapter() {
            @Override
            public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
                System.out.println("4");
                super.write(ctx, msg, promise);
            }
        };

        // 用于测试Handler的Channel
        EmbeddedChannel channel = new EmbeddedChannel(h1, h2, h3, h4);

        // 执行Inbound操作
        channel.writeInbound(ByteBufAllocator.DEFAULT.buffer().writeBytes("测试Inbound".getBytes(StandardCharsets.UTF_8)));
        // 执行Outbound操作
        channel.writeOutbound(ByteBufAllocator.DEFAULT.buffer().writeBytes("测试Outbound".getBytes(StandardCharsets.UTF_8)));
    }
}
```

### 5、ByteBuf

#### 1、调试工具类

```java
public class ByteBufUtil {
    public static void log(ByteBuf buffer) {
        int length = buffer.readableBytes();
        int rows = length / 16 + (length % 15 == 0 ? 0 : 1) + 4;
        StringBuilder buf = new StringBuilder(rows * 80 * 2)
                .append("read index:").append(buffer.readerIndex())
                .append(" write index:").append(buffer.writerIndex())
                .append(" capacity:").append(buffer.capacity())
                .append(NEWLINE);
        appendPrettyHexDump(buf, buffer);
        System.out.println(buf.toString());
    }
}
```

通过该工具类可以更为详细地查看ByteBuf中的内容。

#### 2、创建

```java
public class ByteBufStudy {
    public static void main(String[] args) {
        // 创建ByteBuf
        ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(16);
        ByteBufUtil.log(buffer);

        // 向buffer中写入数据
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 20; i++) {
            sb.append("a");
        }
        buffer.writeBytes(sb.toString().getBytes(StandardCharsets.UTF_8));

        // 查看写入结果
        ByteBufUtil.log(buffer);
    }
}
```

运行结果：

```java
read index:0 write index:0 capacity:16

read index:0 write index:20 capacity:64
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 61 61 61 61 61 61 61 61 61 61 61 61 61 61 61 61 |aaaaaaaaaaaaaaaa|
|00000010| 61 61 61 61                                     |aaaa            |
+--------+-------------------------------------------------+----------------+
```

ByteBuf**通过`ByteBufAllocator`选择allocator并调用对应的buffer()方法来创建**，默认使用**直接内存**作为ByteBuf，容量为256个字节，可以指定初始容量的大小。当ByteBuf的容量无法容纳所有数据时，**ByteBuf会进行扩容操作。**

> **如果在handler中创建ByteBuf，建议使用`ChannelHandlerContext ctx.alloc().buffer()`来创建**

#### 3、直接内存与堆内存

通过该方法创建的ByteBuf，使用的是**基于池化直接内存**的ByteBuf

```java
ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(16);
```

可以使用下面的代码来创建**基于池化堆**的 ByteBuf

```java
ByteBuf buffer = ByteBufAllocator.DEFAULT.heapBuffer(16);
```

也可以使用下面的代码来创建**基于池化直接内存**的 ByteBuf

```java
ByteBuf buffer = ByteBufAllocator.DEFAULT.directBuffer(16);
```

- 直接内存创建和销毁的代价昂贵，但读写性能高（少一次内存复制），适合配合池化功能一起用。
- 直接内存对 GC 压力小，因为这部分内存不受 JVM 垃圾回收的管理，但也要注意及时主动释放，否则会造成内存泄漏，最终可能会导致内存溢出。

**验证**

```java
public class ByteBufStudy {
    public static void main(String[] args) {
        ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(16);
        System.out.println(buffer.getClass());

        buffer = ByteBufAllocator.DEFAULT.heapBuffer(16);
        System.out.println(buffer.getClass());

        buffer = ByteBufAllocator.DEFAULT.directBuffer(16);
        System.out.println(buffer.getClass());
    }
}
```

```java
// 使用池化的直接内存
class io.netty.buffer.PooledUnsafeDirectByteBuf
// 使用池化的堆内存    
class io.netty.buffer.PooledUnsafeHeapByteBuf
// 使用池化的直接内存    
class io.netty.buffer.PooledUnsafeDirectByteBuf
```

#### 4、池化与非池化

池化的最大意义在于可以**重用** ByteBuf，优点有

- 没有池化，则每次都得创建新的 ByteBuf 实例，这个操作对直接内存代价昂贵，就算是堆内存，也会增加 GC 压力
- 有了池化，则可以重用池中 ByteBuf 实例，并且采用了与 jemalloc 类似的内存分配算法提升分配效率
- 高并发时，池化功能更节约内存，减少内存溢出的可能

池化功能是否开启，可以通过下面的系统环境变量来设置：

```java
-Dio.netty.allocator.type={unpooled|pooled}
```

- 4.1 以后，**非 Android 平台默认启用池化实现**，Android 平台启用非池化实现
- 4.1 之前，池化功能还不成熟，默认是非池化实现

#### 5、组成

ByteBuf主要有以下几个组成部分：

- 最大容量与当前容量
  - 在构造ByteBuf时，可传入两个参数，分别代表初始容量和最大容量，若未传入第二个参数（最大容量），最大容量默认为`Integer.MAX_VALUE`
  - 当ByteBuf容量无法容纳所有数据时，会进行扩容操作，若**超出最大容量**，会抛出`java.lang.IndexOutOfBoundsException`异常
- 读写操作不同于ByteBuffer只用position进行控制，ByteBuf分别由读指针和写指针两个指针控制，进行读写操作时，无需进行模式的切换
  - 读指针前的部分被称为废弃部分，是已经读过的内容
  - 读指针与写指针之间的空间称为可读部分
  - 写指针与当前容量之间的空间称为可写部分

#### 6、写入

| 方法签名                                                     | 含义                   | 备注                                        |
| ------------------------------------------------------------ | ---------------------- | ------------------------------------------- |
| writeBoolean(boolean value)                                  | 写入 boolean 值        | 用一字节 01\|00 代表 true\|false            |
| writeByte(int value)                                         | 写入 byte 值           |                                             |
| writeShort(int value)                                        | 写入 short 值          |                                             |
| writeInt(int value)                                          | 写入 int 值            | Big Endian，即 0x250，写入后 00 00 02 50    |
| writeIntLE(int value)                                        | 写入 int 值            | Little Endian，即 0x250，写入后 50 02 00 00 |
| writeLong(long value)                                        | 写入 long 值           |                                             |
| writeChar(int value)                                         | 写入 char 值           |                                             |
| writeFloat(float value)                                      | 写入 float 值          |                                             |
| writeDouble(double value)                                    | 写入 double 值         |                                             |
| writeBytes(ByteBuf src)                                      | 写入 netty 的 ByteBuf  |                                             |
| writeBytes(byte[] src)                                       | 写入 byte[]            |                                             |
| writeBytes(ByteBuffer src)                                   | 写入 nio 的 ByteBuffer |                                             |
| int writeCharSequence(CharSequence sequence, Charset charset) | 写入字符串             |                                             |

> * 这些方法的未指明返回值的，其返回值都是 ByteBuf，意味着可以链式调用来写入不同的数据
>
> - **网络传输中，默认习惯是 Big Endian，使用 writeInt(int value)**

```java
public class ByteBufStudy {
    public static void main(String[] args) {
        // 创建ByteBuf
        ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(16, 20);
        ByteBufUtil.log(buffer);

        // 向buffer中写入数据
        buffer.writeBytes(new byte[]{1, 2, 3, 4});
        ByteBufUtil.log(buffer);

        buffer.writeInt(5);
        ByteBufUtil.log(buffer);

        buffer.writeIntLE(6);
        ByteBufUtil.log(buffer);

        buffer.writeLong(7);
        ByteBufUtil.log(buffer);
    }
}
```

```java
read index:0 write index:0 capacity:16

read index:0 write index:4 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04                                     |....            |
+--------+-------------------------------------------------+----------------+
read index:0 write index:8 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 00 00 00 05                         |........        |
+--------+-------------------------------------------------+----------------+
read index:0 write index:12 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 00 00 00 05 06 00 00 00             |............    |
+--------+-------------------------------------------------+----------------+
read index:0 write index:20 capacity:20
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 00 00 00 05 06 00 00 00 00 00 00 00 |................|
|00000010| 00 00 00 07                                     |....            |
+--------+-------------------------------------------------+----------------+
```

**还有一类方法是 set 开头的一系列方法，也可以写入数据，但不会改变写指针位置。**

#### 7、扩容

当ByteBuf中的容量无法容纳写入的数据时，会进行扩容操作。

```java
public class ByteBufStudy {
    public static void main(String[] args) {
        // 创建ByteBuf
        ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(8);
        ByteBufUtil.log(buffer);

        // 向buffer中写入数据
        buffer.writeBytes(new byte[]{1, 2, 3, 4});
        ByteBufUtil.log(buffer);
        //空间正好够8个字节
        buffer.writeInt(5);
        ByteBufUtil.log(buffer);
        //继续添加会实现自动扩容，主要不指定最大容量，就会默认是Integer.MAX_VALUE
        buffer.writeInt(5);
        ByteBufUtil.log(buffer);
    }
}
```

```java
read index:0 write index:0 capacity:8

read index:0 write index:4 capacity:8
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04                                     |....            |
+--------+-------------------------------------------------+----------------+
read index:0 write index:8 capacity:8
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 00 00 00 05                         |........        |
+--------+-------------------------------------------------+----------------+
read index:0 write index:12 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 00 00 00 05 00 00 00 05             |............    |
+--------+-------------------------------------------------+----------------+
```

> **扩容规则**
>
> * 不指定初始化容量大小，默认值是256字节（`ByteBufAllocator.DEFAULT.directBuffer()`）
>
> * 如果写入后数据大小未超过 512 字节，则选择下一个 16 的整数倍进行扩容
>   * 例如写入后大小为 12 字节，则扩容后 capacity 是 16 字节
> * 如果写入后数据大小超过 512 字节，则选择下一个 2的N次方的整数进行扩容
>   * 例如写入后大小为 513 字节，则扩容后 capacity 是 2的十次方，也就是1024 字节
> * 扩容不能超过 maxCapacity，否则会抛出`java.lang.IndexOutOfBoundsException`异常

#### 8、读取

读取主要是通过一系列read方法进行读取，读取时会根据读取数据的字节数移动读指针。如果需要**重复读取**，需要调用`buffer.markReaderIndex()`对读指针进行标记，并通过`buffer.resetReaderIndex()`将读指针恢复到mark标记的位置。

```java
public class ByteBufStudy {
    public static void main(String[] args) {
        // 创建ByteBuf
        ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(16, 20);

        // 向buffer中写入数据
        buffer.writeBytes(new byte[]{1, 2, 3, 4});
        buffer.writeInt(5);
        ByteBufUtil.log(buffer);

        // 读取4个字节
        System.out.println(buffer.readByte());
        System.out.println(buffer.readByte());
        System.out.println(buffer.readByte());
        System.out.println(buffer.readByte());
        ByteBufUtil.log(buffer);

        // 通过mark与reset实现重复读取
        buffer.markReaderIndex();
        System.out.println(buffer.readInt());
        ByteBufUtil.log(buffer);

        // 恢复到mark标记处
        buffer.resetReaderIndex();
        ByteBufUtil.log(buffer);
    }
}
```

```java
//初始状态
read index:0 write index:8 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 01 02 03 04 00 00 00 05                         |........        |
+--------+-------------------------------------------------+----------------+
  //读取前4个字节的数据
1
2
3
4
  //读取后Bytebuf的状态->源代码中对此状态进行了标记（快照）
read index:4 write index:8 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 00 00 05                                     |....            |
+--------+-------------------------------------------------+----------------+
  //读取出4个字节的数据
5
  //打印当前ByteBuf的状态->已经没有数据可读了
read index:8 write index:8 capacity:16
//源代码对标记进行恢复，可以实现重复读
read index:4 write index:8 capacity:16
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 00 00 05                                     |....            |
+--------+-------------------------------------------------+----------------+
```

**还有以 get 开头的一系列方法，这些方法不会改变读指针的位置。**

#### 9、释放



#### 10、切片





#### 11、优势





























































## 四、应用

### 1、粘包与半包

#### 1、粘包现象

**服务器端代码**

```java
public class StudyServer {
    void start() {
        NioEventLoopGroup boss = new NioEventLoopGroup(1);
        NioEventLoopGroup worker = new NioEventLoopGroup(2);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                            System.out.println("---channelActive---");
                            // 连接建立时会执行该方法
                            super.channelActive(ctx);
                        }

                        @Override
                        public void channelInactive(ChannelHandlerContext ctx) throws Exception {
                            System.out.println("---channelInactive---");
                            // 连接断开时会执行该方法
                            super.channelInactive(ctx);
                        }
                    });
                }
            });
            ChannelFuture channelFuture = serverBootstrap.bind(8080);
            channelFuture.sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }

    public static void main(String[] args) {
        new StudyServer().start();
    }
}
```

**客户端代码**

```java
public class StudyClient {

    public static void main(String[] args) {
        NioEventLoopGroup worker = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(worker);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {

                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                      //连接建立之后立即执行
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                            // 每次发送16个字节的数据，共发送10次
                            for (int i = 0; i < 10; i++) {
                                ByteBuf buffer = ctx.alloc().buffer();
                                buffer.writeBytes(new byte[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15});
                              //通过channel向服务器发送消息
                                ctx.writeAndFlush(buffer);
                            }
                            //关闭连接
                            ctx.channel().close();
                        }
                    });
                }
            });
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 8080).sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            worker.shutdownGracefully();
        }
    }
}
```

**服务器端接收到的数据**

```java
10:53:12.970 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x3805c5dc, L:/127.0.0.1:8080 - R:/127.0.0.1:59105] REGISTERED
10:53:12.970 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x3805c5dc, L:/127.0.0.1:8080 - R:/127.0.0.1:59105] ACTIVE
  //服务器连接建立之后执行了channelActive
---channelActive---
  //一次性读取了160B的数据
10:53:12.993 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x3805c5dc, L:/127.0.0.1:8080 - R:/127.0.0.1:59105] READ: 160B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000010| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000020| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000030| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000040| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000050| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000060| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000070| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000080| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
|00000090| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
  //读取完成
10:53:12.994 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x3805c5dc, L:/127.0.0.1:8080 - R:/127.0.0.1:59105] READ COMPLETE
  //客户端关闭连接
10:53:12.996 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x3805c5dc, L:/127.0.0.1:8080 ! R:/127.0.0.1:59105] INACTIVE
  //服务器执行channelInactive
---channelInactive---
10:53:12.996 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x3805c5dc, L:/127.0.0.1:8080 ! R:/127.0.0.1:59105] UNREGISTERED

```

可见虽然客户端是分别以16字节为单位，通过channel向服务器发送了10次数据，可是**服务器端却只接收了一次，接收数据的大小为160B，即客户端发送的数据总大小，这就是粘包现象（将多个消息粘到了一起）。**

#### 2、半包现象

**调整服务器端接收缓冲区的大小：**

```java
// 调整系统的接收缓冲区（滑动窗口）->一般不需要调整，因为其影响的是Netty读取的最小单位，一般都是修改Netty的接收缓冲区大小，默认是1024字节
// serverBootstrap.option(ChannelOption.SO_RCVBUF, 10);
// 调整 Netty 的接收缓冲区（byteBuf）
// serverBootstrap.childOption(ChannelOption.RCVBUF_ALLOCATOR, new AdaptiveRecvByteBufAllocator(16, 16, 16));
```

> 在测试粘包现象时，在服务器端添加了执行器：
>
> ```java
> ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
>  @Override
>  public void channelActive(ChannelHandlerContext ctx) throws Exception {
>      System.out.println("---channelActive---");
>      // 连接建立时会执行该方法
>      super.channelActive(ctx);
>  }
> 
>  @Override
>  public void channelInactive(ChannelHandlerContext ctx) throws Exception {
>      System.out.println("---channelInactive---");
>      // 连接断开时会执行该方法
>      super.channelInactive(ctx);
>  }
> });
> ```
>
> 该执行器在测试半包及粘包现象时并没有帮助作用，只是方便在客户端建立连接之后立即发送数据，了解两个方法的作用之后可以在服务器代码中删掉。

**服务器端代码**

```java
public class StudyServer {
    void start() {
        NioEventLoopGroup boss = new NioEventLoopGroup(1);
        NioEventLoopGroup worker = new NioEventLoopGroup(2);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
          //修改Netty 的接收缓冲区（byteBuf）大小
            serverBootstrap.childOption(ChannelOption.RCVBUF_ALLOCATOR, new AdaptiveRecvByteBufAllocator(16, 16, 16));
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                }
            });
            ChannelFuture channelFuture = serverBootstrap.bind(8080);
            channelFuture.sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }

    public static void main(String[] args) {
        new StudyServer().start();
    }
}
```

**客户端代码**

```java
public class StudyClient {

    public static void main(String[] args) {
        NioEventLoopGroup worker = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(worker);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                          //每次发送18B数据，发送3次
                            for (int i = 0; i < 3; i++) {
                                ByteBuf buffer = ctx.alloc().buffer();
                                buffer.writeBytes(new byte[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17});
                                ctx.writeAndFlush(buffer);
                            }
                        }
                    });
                }
            });
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 8080).sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            worker.shutdownGracefully();
        }
    }
}
```

**服务器端接收到的数据：**

```java
11:51:02.438 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xa7da10d5, L:/127.0.0.1:8080 - R:/127.0.0.1:52238] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
11:51:02.438 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xa7da10d5, L:/127.0.0.1:8080 - R:/127.0.0.1:52238] READ: 2B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 10 11                                           |..              |
+--------+-------------------------------------------------+----------------+
11:51:02.439 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xa7da10d5, L:/127.0.0.1:8080 - R:/127.0.0.1:52238] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
11:51:02.440 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xa7da10d5, L:/127.0.0.1:8080 - R:/127.0.0.1:52238] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 10 11 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d |................|
+--------+-------------------------------------------------+----------------+
11:51:02.440 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xa7da10d5, L:/127.0.0.1:8080 - R:/127.0.0.1:52238] READ: 4B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 0e 0f 10 11                                     |....            |
+--------+-------------------------------------------------+----------------+
```

客户端每次发送18字节的数据，但是由于服务器端接收缓冲区的大小为16字节，所以只能将剩下的数据在下一次发送过来，这样就将一条18字节完整的消息拆分成两次进行发送，这就是半包现象。

> 注意：
>
> `serverBootstrap.option(ChannelOption.SO_RCVBUF, 10)` 影响的底层接收缓冲区（即滑动窗口）大小，仅决定了 Netty 读取的最小单位，但是Netty 实际每次读取的一般是16的整数倍，Netty默认的缓冲区大小是1024字节，可以通过`serverBootstrap.childOption`进行设置。

#### 3、原理分析

> 粘包

- 现象（多个消息被粘合到一起接收）
  - 发送 abc def，接收 abcdef
- 原因
  - 应用层
    - 接收方 ByteBuf 设置太大（Netty 默认 1024）
  - 传输层-网络层
    - 滑动窗口：假设发送方 256 bytes 表示一个完整报文，但由于接收方处理不及时且窗口大小足够大（大于256 bytes），这 256 bytes 字节就会缓冲在接收方的滑动窗口中，当滑动窗口中缓冲了多个报文就会粘包
    - Nagle 算法：会造成粘包

> 半包

- 现象（一个消息被分开接收）
  - 发送 abcdef，接收 abc def
- 原因
  - 应用层
    - 接收方 ByteBuf 小于实际发送数据量
  - 传输层-网络层
    - 滑动窗口：假设接收方的窗口只剩了 128 bytes，发送方的报文大小是 256 bytes，这时接收方窗口中无法容纳发送方的全部报文，发送方只能先发送前 128 bytes，等待 ack 后才能发送剩余部分，这就造成了半包
  - 数据链路层
    - MSS 限制：当发送的数据超过 MSS 限制后，会将数据切分发送，就会造成半包

> 本质

发生粘包与半包现象的本质是**因为 TCP 是流式协议，消息无边界。**

#### 4、解决方案

> * 短链接方式即建立一次连接，发送一个消息，然后断开连接，这样连接建立到连接断开之间就是消息的边界，缺点效率太低
>
> * 每一条消息采用固定长度，缺点浪费空间
>
> * 每一条消息采用分隔符，例如 \n，缺点需要转义
>
> * 每一条消息分为 head 和 body，head 中包含 body 的长度

##### 1、短连接

**客户端每次向服务器发送数据以后，就与服务器断开连接，此时的消息边界为连接建立到连接断开**。此时如果服务器端接收缓冲区足够大，则不会发生粘包现象。但如果一次性数据发送过多，接收方无法一次性容纳所有数据，还是会发生半包现象，所以**短链接无法解决半包现象。**

**服务器端代码**

```java
public class StudyServer {
    void start() {
        NioEventLoopGroup boss = new NioEventLoopGroup(1);
        NioEventLoopGroup worker = new NioEventLoopGroup(2);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                }
            });
            ChannelFuture channelFuture = serverBootstrap.bind(8080);
            channelFuture.sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }

    public static void main(String[] args) {
        new StudyServer().start();
    }
}
```

**客户端代码**

```java
public class StudyClient {

    public static void main(String[] args) {
        for (int i = 0; i < 4; i++) {
            //将发送消息和断开连接封装成一个方法
            sendMessage();
        }
    }

    private static void sendMessage() {
        NioEventLoopGroup worker = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(worker);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                            //连接建立发送消息
                            ByteBuf buffer = ctx.alloc().buffer();
                            buffer.writeBytes(new byte[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15});
                            ctx.writeAndFlush(buffer);
                            //发送消息完毕直接关闭当前连接
                            ctx.channel().close();
                        }
                    });
                }
            });
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 8080).sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            worker.shutdownGracefully();
        }
    }
}
```

**服务器端接收到的数据**

```java
12:34:19.748 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xc66b0759, L:/127.0.0.1:8080 - R:/127.0.0.1:59142] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
12:34:19.748 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xab6e04cf, L:/127.0.0.1:8080 - R:/127.0.0.1:59141] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
12:34:19.752 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0xc0916bf1, L:/127.0.0.1:8080 - R:/127.0.0.1:59144] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
12:34:19.753 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x9d1db727, L:/127.0.0.1:8080 - R:/127.0.0.1:59143] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
```

但是如果客户端一次性发送的数据过多，服务端的接收缓冲区较小，仍然会产生半包现象。

**客户端代码修改**

```java
protected void initChannel(SocketChannel ch) throws Exception {
    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
        @Override
        public void channelActive(ChannelHandlerContext ctx) throws Exception {
            //连接建立发送消息
            ByteBuf buffer = ctx.alloc().buffer();
          //一次性发送18B的数据
            buffer.writeBytes(new byte[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17});
            ctx.writeAndFlush(buffer);
            //发送消息完毕直接关闭当前连接
            ctx.channel().close();
        }
    });
}
```

**服务器端代码修改**

```java
//Netty的缓冲区只能接收16字节的数据
serverBootstrap.childOption(ChannelOption.RCVBUF_ALLOCATOR, new AdaptiveRecvByteBufAllocator(16, 16, 16));
```

**运行结果**

```java
//62253连接
12:53:58.783 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x86e77db1, L:/127.0.0.1:8080 - R:/127.0.0.1:62253] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
  //62254连接
12:53:58.783 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x293260ad, L:/127.0.0.1:8080 - R:/127.0.0.1:62254] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
    //62254连接剩余数据
12:53:58.785 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x293260ad, L:/127.0.0.1:8080 - R:/127.0.0.1:62254] READ: 2B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 10 11                                           |..              |
+--------+-------------------------------------------------+----------------+
  //62253连接剩余数据
12:53:58.785 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x86e77db1, L:/127.0.0.1:8080 - R:/127.0.0.1:62253] READ: 2B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 10 11                                           |..              |
+--------+-------------------------------------------------+----------------+
12:53:58.786 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x5dddab8c, L:/127.0.0.1:8080 - R:/127.0.0.1:62255] READ: 16B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f |................|
+--------+-------------------------------------------------+----------------+
12:53:58.788 [nioEventLoopGroup-3-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x5dddab8c, L:/127.0.0.1:8080 - R:/127.0.0.1:62255] READ: 2B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 10 11                                           |..              |
+--------+-------------------------------------------------+----------------+

```

从上面代码可以看出，数据并没有丢失，在一次连接中产生了半包现象，即一次连接中两次发送数据给服务器，这样服务器才得到了完整的数据。

##### 2、固定长度消息解码器

`io.netty.handler.codec.FixedLengthFrameDecoder`

客户端和服务器**约定一个最大长度，保证客户端每次发送的数据长度都不会大于该长度**。若客户端发送数据长度不足则需要**补齐**至该长度，服务器接收数据时，**将接收到的数据按照约定的最大长度进行拆分**，即使发送过程中产生了粘包，也可以通过定长解码器将数据正确地进行拆分。**服务端需要用到`FixedLengthFrameDecoder`对数据进行定长解码。**

**服务器端代码**

```java
public class StudyServer {
    void start() {
        NioEventLoopGroup boss = new NioEventLoopGroup(1);
        NioEventLoopGroup worker = new NioEventLoopGroup(2);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    //固定长度消息解码器-固定长度为10
                    ch.pipeline().addLast(new FixedLengthFrameDecoder(10));
                  //将解码器放在日志打印前面，确保消息被正常的拆分
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                }
            });
            ChannelFuture channelFuture = serverBootstrap.bind(8080);
            channelFuture.sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }

    public static void main(String[] args) {
        new StudyServer().start();
    }
}
```

**客户端代码**

```java
public class StudyClient {

    public static void main(String[] args) {
        sendMessage();

    }

    public static byte[] fill10Bytes(char c, int len) {
        //约定消息固定长度为10
        byte[] bytes = new byte[10];
        Arrays.fill(bytes, (byte) '_');
        for (int i = 0; i < len; i++) {
            bytes[i] = (byte) c;
        }
        return bytes;
    }


    private static void sendMessage() {
        NioEventLoopGroup worker = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(worker);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    //打印日志
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                    //发送消息
                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                        // 会在连接 channel 建立成功后，会触发 active 事件
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) {
                            ByteBuf buf = ctx.alloc().buffer();
                            char c = '0';
                            Random r = new Random();
                            for (int i = 0; i < 3; i++) {
                                byte[] bytes = fill10Bytes(c, r.nextInt(10) + 1);
                                c++;
                                buf.writeBytes(bytes);
                            }
                            //一次性发送
                            ctx.writeAndFlush(buf);
                        }
                    });
                }
            });
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 8080).sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            worker.shutdownGracefully();
        }
    }
}


```

**服务器端接收到的数据**

```java
13:16:45.326 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x523feaa1, L:/127.0.0.1:8080 - R:/127.0.0.1:49480] READ: 10B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 30 30 5f 5f 5f 5f 5f 5f 5f 5f                   |00________      |
+--------+-------------------------------------------------+----------------+
13:16:45.326 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x523feaa1, L:/127.0.0.1:8080 - R:/127.0.0.1:49480] READ: 10B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 31 31 31 31 31 5f 5f 5f 5f 5f                   |11111_____      |
+--------+-------------------------------------------------+----------------+
13:16:45.326 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x523feaa1, L:/127.0.0.1:8080 - R:/127.0.0.1:49480] READ: 10B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 32 32 32 32 32 5f 5f 5f 5f 5f                   |22222_____      |
+--------+-------------------------------------------------+----------------+
```

**客户端发送的数据**

```java
//出现了粘包，但是在服务器端可以正常划分出消息
13:16:45.323 [nioEventLoopGroup-2-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x8bf2c23f, L:/127.0.0.1:49480 - R:/127.0.0.1:8080] WRITE: 30B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 30 30 5f 5f 5f 5f 5f 5f 5f 5f 31 31 31 31 31 5f |00________11111_|
|00000010| 5f 5f 5f 5f 32 32 32 32 32 5f 5f 5f 5f 5f       |____22222_____  |
+--------+-------------------------------------------------+----------------+
```

##### 3、基于分隔符的消息解码器

`io.netty.handler.codec.LineBasedFrameDecoder`

`io.netty.handler.codec.DelimiterBasedFrameDecoder`

**通过分隔符对数据进行拆分**来解决粘包半包问题，可以通过`LineBasedFrameDecoder(int maxLength)`来拆分以`\n`或者`\r\n`为分隔符的数据，也可以通过`DelimiterBasedFrameDecoder(int maxFrameLength, ByteBuf... delimiters)`来**自定义分隔符从而实现拆分数据（可以传入多个分隔符）。**

> 两种解码器**都需要传入数据的最大长度**，若超出最大长度，会抛出`TooLongFrameException`异常。

**服务器端代码**

```java
public class StudyServer {
    void start() {
        NioEventLoopGroup boss = new NioEventLoopGroup(1);
        NioEventLoopGroup worker = new NioEventLoopGroup(2);
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    //基于分隔符的消息解码器-如果读取了1024个字节还没有发现分隔符就会报异常
                    ch.pipeline().addLast(new LineBasedFrameDecoder(1024));
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                }
            });
            ChannelFuture channelFuture = serverBootstrap.bind(8080);
            channelFuture.sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }

    public static void main(String[] args) {
        new StudyServer().start();
    }
}
```

**客户端代码**

```java
public class StudyClient {

    public static void main(String[] args) {
        sendMessage();

    }
//构造含有换行符的字符串
    public static String makeString(char c, int len) {
        StringBuilder sb = new StringBuilder(len + 2);
        for (int i = 0; i < len; i++) {
            sb.append(c);
        }
        sb.append("\n");
        return sb.toString();
    }

    private static void sendMessage() {
        NioEventLoopGroup worker = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(worker);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    //打印日志
                    ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                    //发送消息
                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                        // 会在连接 channel 建立成功后，会触发 active 事件
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) {
                            ByteBuf buf = ctx.alloc().buffer();
                            char c = 'a';
                            Random r = new Random();
                            for (int i = 0; i < 3; i++) {
                                String sb = makeString(c, r.nextInt(5) + 1);
                                c++;
                                buf.writeBytes(sb.getBytes());
                            }
                            //一次性发送
                            ctx.writeAndFlush(buf);
                        }
                    });
                }
            });
            ChannelFuture channelFuture = bootstrap.connect("127.0.0.1", 8080).sync();
            channelFuture.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            worker.shutdownGracefully();
        }
    }
}
```

**服务器端接收到的数据**

```java
13:37:01.039 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x0787dfae, L:/127.0.0.1:8080 - R:/127.0.0.1:52708] READ: 3B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 61 61 61                                        |aaa             |
+--------+-------------------------------------------------+----------------+
13:37:01.039 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x0787dfae, L:/127.0.0.1:8080 - R:/127.0.0.1:52708] READ: 3B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 62 62 62                                        |bbb             |
+--------+-------------------------------------------------+----------------+
13:37:01.039 [nioEventLoopGroup-3-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x0787dfae, L:/127.0.0.1:8080 - R:/127.0.0.1:52708] READ: 5B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 63 63 63 63 63                                  |ccccc           |
+--------+-------------------------------------------------+----------------+
```

**客户端发送的数据**

```java
13:37:01.036 [nioEventLoopGroup-2-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x795fc01d, L:/127.0.0.1:52708 - R:/127.0.0.1:8080] WRITE: 14B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 61 61 61 0a 62 62 62 0a 63 63 63 63 63 0a       |aaa.bbb.ccccc.  |
+--------+-------------------------------------------------+----------------+
```

从运行结果可以看到**一个换行符占据一个字节。**

> 使用自定义分隔符的消息解码器：
>
> ```java
> //固定长度消息解码器-固定长度为10
> ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer(16);
> ch.pipeline().addLast(new DelimiterBasedFrameDecoder(1024, buffer.writeBytes("\n".getBytes())));
> ```

##### 4、基于长度字段的消息解码器

`io.netty.handler.codec.LengthFieldBasedFrameDecoder`

在传送数据时可以在数据中**添加一个用于表示有用数据长度的字段。**`LengthFieldBasedFrameDecoder`解码器可以提供更为丰富的拆分方法，其构造方法有五个参数：

```java
public LengthFieldBasedFrameDecoder(
    int maxFrameLength,
    int lengthFieldOffset, int lengthFieldLength,
    int lengthAdjustment, int initialBytesToStrip)
//具体参数的设置应该根据不同的协议进行分析
```

**参数解析**

- `maxFrameLength` **数据最大长度**
  - 表示数据的最大长度（包括附加信息、长度标识等内容）
- `lengthFieldOffset` **长度字段的起始偏移量**
  - 用于指明数据第几个字节开始是用于标识有用数据字节长度的，因为前面可能还有其他附加信息
- `lengthFieldLength` **长度字段所占字节数**（用于指明有用数据的长度）
  - 数据中用于表示有用数据长度的标识所占的字节数
- `lengthAdjustment` **长度表示与有用数据的偏移量**
  - 用于指明数据长度标识和有用数据之间的距离，因为两者之间还可能有附加信息
- `initialBytesToStrip` **数据读取起点**
  - 读取起点，不读取0 到 `initialBytesToStrip` 之间的数据

**例子**

```java
//例子1->长度值仅代表有用数据的长度
<pre>                                                       
<b>lengthFieldOffset</b>   = <b>0</b>                       
<b>lengthFieldLength</b>   = <b>2</b>                       
lengthAdjustment    = 0                                     
initialBytesToStrip = 0 (= do not strip header)             
                                                            
BEFORE DECODE (14 bytes)         AFTER DECODE (14 bytes)    
+--------+----------------+      +--------+----------------+
| Length | Actual Content |----->| Length | Actual Content |
| 0x000C | "HELLO, WORLD" |      | 0x000C | "HELLO, WORLD" |
+--------+----------------+      +--------+----------------+
</pre>                                                      
//例子2
<pre>                                                                    
lengthFieldOffset   = 0                                                  
lengthFieldLength   = 2                                                  
lengthAdjustment    = 0                                                  
<b>initialBytesToStrip</b> = <b>2</b> (= the length of the Length field) 
                                                                         
BEFORE DECODE (14 bytes)         AFTER DECODE (12 bytes)                 
+--------+----------------+      +----------------+                      
| Length | Actual Content |----->| Actual Content |                      
| 0x000C | "HELLO, WORLD" |      | "HELLO, WORLD" |                      
+--------+----------------+      +----------------+                      
</pre>           
//例子3->长度值仅代表所有数据的长度
<pre>                                                                     
lengthFieldOffset   =  0                                                  
lengthFieldLength   =  2                                                  
<b>lengthAdjustment</b>    = <b>-2</b> (= the length of the Length field) 
initialBytesToStrip =  0                                                  
                                                                          
BEFORE DECODE (14 bytes)         AFTER DECODE (14 bytes)                  
+--------+----------------+      +--------+----------------+              
| Length | Actual Content |----->| Length | Actual Content |              
| 0x000E | "HELLO, WORLD" |      | 0x000E | "HELLO, WORLD" |              
+--------+----------------+      +--------+----------------+              
</pre>      
//例子4
<pre>                                                                                   
<b>lengthFieldOffset</b>   = <b>2</b> (= the length of Header 1)                        
<b>lengthFieldLength</b>   = <b>3</b>                                                   
lengthAdjustment    = 0                                                                 
initialBytesToStrip = 0                                                                 
                                                                                        
BEFORE DECODE (17 bytes)                      AFTER DECODE (17 bytes)                   
+----------+----------+----------------+      +----------+----------+----------------+  
| Header 1 |  Length  | Actual Content |----->| Header 1 |  Length  | Actual Content |  
|  0xCAFE  | 0x00000C | "HELLO, WORLD" |      |  0xCAFE  | 0x00000C | "HELLO, WORLD" |  
+----------+----------+----------------+      +----------+----------+----------------+  
</pre>                                                                                  
//例子5
<pre>                                                                                  
lengthFieldOffset   = 0                                                                
lengthFieldLength   = 3                                                                
<b>lengthAdjustment</b>    = <b>2</b> (= the length of Header 1)                       
initialBytesToStrip = 0                                                                
                                                                                       
BEFORE DECODE (17 bytes)                      AFTER DECODE (17 bytes)                  
+----------+----------+----------------+      +----------+----------+----------------+ 
|  Length  | Header 1 | Actual Content |----->|  Length  | Header 1 | Actual Content | 
| 0x00000C |  0xCAFE  | "HELLO, WORLD" |      | 0x00000C |  0xCAFE  | "HELLO, WORLD" | 
+----------+----------+----------------+      +----------+----------+----------------+ 
</pre>
//例子6
<pre>                                                                        
lengthFieldOffset   = 1 (= the length of HDR1)                               
lengthFieldLength   = 2                                                      
<b>lengthAdjustment</b>    = <b>1</b> (= the length of HDR2)                 
<b>initialBytesToStrip</b> = <b>3</b> (= the length of HDR1 + LEN)           
                                                                             
BEFORE DECODE (16 bytes)                       AFTER DECODE (13 bytes)       
+------+--------+------+----------------+      +------+----------------+     
| HDR1 | Length | HDR2 | Actual Content |----->| HDR2 | Actual Content |     
| 0xCA | 0x000C | 0xFE | "HELLO, WORLD" |      | 0xFE | "HELLO, WORLD" |     
+------+--------+------+----------------+      +------+----------------+     
</pre>    
//例子7->长度值仅代表所有数据的长度
<pre>                                                                        
lengthFieldOffset   =  1                                                     
lengthFieldLength   =  2                                                     
<b>lengthAdjustment</b>    = <b>-3</b> (= the length of HDR1 + LEN, negative)
<b>initialBytesToStrip</b> = <b> 3</b>                                       
                                                                             
BEFORE DECODE (16 bytes)                       AFTER DECODE (13 bytes)       
+------+--------+------+----------------+      +------+----------------+     
| HDR1 | Length | HDR2 | Actual Content |----->| HDR2 | Actual Content |     
| 0xCA | 0x0010 | 0xFE | "HELLO, WORLD" |      | 0xFE | "HELLO, WORLD" |     
+------+--------+------+----------------+      +------+----------------+     
</pre>   

```

> 关于lengthAdjustment为什么可以是负数？参考：https://www.cnblogs.com/motianlong/p/14465098.html

**图解**

**使用**

```java
public class TestLengthFieldDecoder {
    public static void main(String[] args) {
        EmbeddedChannel channel = new EmbeddedChannel(
                new LengthFieldBasedFrameDecoder(
                        1024, 0, 4, 1, 5),
                new LoggingHandler(LogLevel.DEBUG)
        );

        //  4 个字节的内容长度+Header+实际内容
        ByteBuf buffer = ByteBufAllocator.DEFAULT.buffer();
        build(buffer, "Hello, world");
        build(buffer, "Hi!");
        channel.writeInbound(buffer);
    }

    private static void build(ByteBuf buffer, String content) {
        byte[] bytes = content.getBytes(); // 实际内容
        int length = bytes.length; // 实际内容长度
        //长度字段
        buffer.writeInt(length);
        //Header字段
        buffer.writeByte(1);
        //有效数据字段
        buffer.writeBytes(bytes);
    }
}
```

```java
14:52:00 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ: 12B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 48 65 6c 6c 6f 2c 20 77 6f 72 6c 64             |Hello, world    |
+--------+-------------------------------------------------+----------------+
14:52:00 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ: 3B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 48 69 21                                        |Hi!             |
+--------+-------------------------------------------------+----------------+
```

### 2、协议设计与解析

#### 1、协议的作用

> 协议的目的就是划定消息的边界，制定通信双方要共同遵守的通信规则。

#### 2、Redis中的协议

和Redis服务器通信，需要按照Redis协议向服务器发送命令，在Redis中，向Redis服务器发送一条`set name Nyima`的指令，需要遵守**如下协议：**

```java
// 该指令一共有3部分，每条指令之后都要添加回车与换行符
// 将命令看作是一个数组，第一个参数代表的是数组长度
*3\r\n
// 第一个指令的长度是3
$3\r\n
// 第一个指令是set指令
set\r\n
// 第二个指令的长度是4
$4\r\n
// 第二个指令是name
name\r\n
// 第三个指令的长度是5
$5\r\n
// 第三个指令是Nyima
Nyima\r\n
```

**客户端代码**

```java
public class RedisClient {

    public static void main(String[] args) {
        NioEventLoopGroup group = new NioEventLoopGroup();
        try {
            ChannelFuture channelFuture = new Bootstrap()
                    .group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            // 打印日志
                            ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                            // 入站处理器
                            ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
                                //连接建立的时候立即执行
                                @Override
                                public void channelActive(ChannelHandlerContext ctx) throws Exception {
                                    // 回车与换行符
                                    final byte[] LINE = {'\r', '\n'};
                                    // 获得ByteBuf
                                    ByteBuf buffer = ctx.alloc().buffer();
                                    // 连接建立后，向Redis中发送一条指令，注意添加回车与换行
                                    // set name Nyima
                                    buffer.writeBytes("*3".getBytes());
                                    buffer.writeBytes(LINE);
                                    buffer.writeBytes("$3".getBytes());
                                    buffer.writeBytes(LINE);
                                    buffer.writeBytes("set".getBytes());
                                    buffer.writeBytes(LINE);
                                    buffer.writeBytes("$4".getBytes());
                                    buffer.writeBytes(LINE);
                                    buffer.writeBytes("name".getBytes());
                                    buffer.writeBytes(LINE);
                                    buffer.writeBytes("$5".getBytes());
                                    buffer.writeBytes(LINE);
                                    buffer.writeBytes("Nyima".getBytes());
                                    buffer.writeBytes(LINE);
                                    //一次性发送数据
                                    ctx.writeAndFlush(buffer);
                                }
                            });
                        }
                    })
                    .connect(new InetSocketAddress("localhost", 6379));
            channelFuture.sync();
            // 关闭channel
            channelFuture.channel().close().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            // 关闭group
            group.shutdownGracefully();
        }
    }
}
```

```java
21:31:58.072 [nioEventLoopGroup-2-1] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x5f81273d, L:/127.0.0.1:56694 - R:localhost/127.0.0.1:6379] WRITE: 34B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 2a 33 0d 0a 24 33 0d 0a 73 65 74 0d 0a 24 34 0d |*3..$3..set..$4.|
|00000010| 0a 6e 61 6d 65 0d 0a 24 35 0d 0a 4e 79 69 6d 61 |.name..$5..Nyima|
|00000020| 0d 0a                                           |..              |
+--------+-------------------------------------------------+----------------+
```

通过Redis客户端查看Redis中存储的数据如下：

通过上述客户端代码可以看出只要遵守Redis的协议向其服务器发送命令，服务器就可以解析该命令并执行。

#### 3、HTTP协议

HTTP协议包含复杂的内容，自己实现较为困难，可以使用`HttpServerCodec`作为**服务器端的解码器与编码器，来处理HTTP请求。**

```java
// HttpServerCodec 中既有请求的解码器 HttpRequestDecoder 又有响应的编码器 HttpResponseEncoder
// 一般带有Codec(CodeCombine) 就说明该类既作为 编码器 又作为 解码器
public final class HttpServerCodec extends CombinedChannelDuplexHandler<HttpRequestDecoder, HttpResponseEncoder>
        implements HttpServerUpgradeHandler.SourceCodec
```

**服务器端代码**

```java
public class HttpServer {

    public static void main(String[] args) {
        NioEventLoopGroup group = new NioEventLoopGroup();
        new ServerBootstrap()
                .group(group)
                .channel(NioServerSocketChannel.class)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        // 打印日志
                        ch.pipeline().addLast(new LoggingHandler(LogLevel.DEBUG));
                        // 作为服务器，使用 HttpServerCodec 作为编码器与解码器，既是入站又是出战
                        ch.pipeline().addLast(new HttpServerCodec());
                        // 解码器获得的是什么类型的数据（两种）
//                        ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {
//                            @Override
//                            public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
//                                System.out.println("---" + msg.getClass() + "---");
//                                //---class io.netty.handler.codec.http.DefaultHttpRequest---请求行，请求头
//                                //---class io.netty.handler.codec.http.LastHttpContent$1---请求体
//                                if (msg instanceof HttpRequest) {
//                                    System.out.println("请求行、请求头的处理");
//                                } else if (msg instanceof HttpContent) {
//                                    System.out.println("请求体的处理");
//                                }
//                            }
//                        });
                        // 服务器只处理HTTPRequest-使用SimpleChannelInboundHandler传入泛型
                        ch.pipeline().addLast(new SimpleChannelInboundHandler<HttpRequest>() {
                            @Override
                            protected void channelRead0(ChannelHandlerContext ctx, HttpRequest msg) {
                                // 获得请求uri
                                System.out.println(msg.uri());
                                // 获得完整响应，设置版本号与状态码，进行返回
                                DefaultFullHttpResponse response = new DefaultFullHttpResponse(msg.protocolVersion(), HttpResponseStatus.OK);
                                // 设置响应内容
                                byte[] bytes = "<h1>Hello, World!</h1>".getBytes(StandardCharsets.UTF_8);
                                // 设置响应体长度，避免浏览器一直接收响应内容
                                response.headers().setInt(CONTENT_LENGTH, bytes.length);
                                // 设置响应体
                                response.content().writeBytes(bytes);
                                // 写回响应
                                ctx.writeAndFlush(response);
                            }
                        });
                    }
                })
                .bind(8080);
    }
}
```

服务器负责处理请求并响应浏览器，所以**只需要处理HTTP请求头和请求行**即可：

```java
// 服务器只处理HTTPRequest
ch.pipeline().addLast(new SimpleChannelInboundHandler<HttpRequest>()
```

获得请求后，需要返回响应给浏览器。需要创建响应对象`DefaultFullHttpResponse`，设置HTTP版本号及状态码，为避免浏览器获得响应后，因为未设置`CONTENT_LENGTH`而一直空转接收响应内容，所以需要添加`CONTENT_LENGTH`字段，表明响应体中数据的具体长度。

```java
// 获得完整响应，设置版本号与状态码
DefaultFullHttpResponse response = new DefaultFullHttpResponse(msg.protocolVersion(), HttpResponseStatus.OK);
// 设置响应内容
byte[] bytes = "<h1>Hello, World!</h1>".getBytes(StandardCharsets.UTF_8);
// 设置响应体长度，避免浏览器一直接收响应内容
response.headers().setInt(CONTENT_LENGTH, bytes.length);
// 设置响应体
response.content().writeBytes(bytes);
```

运行结果：

```java
//浏览器请求
00:48.091 [nioEventLoopGroup-2-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x393520e9, L:/0:0:0:0:0:0:0:1:8080 - R:/0:0:0:0:0:0:0:1:61142] READ: 698B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 47 45 54 20 2f 20 48 54 54 50 2f 31 2e 31 0d 0a |GET / HTTP/1.1..|
|00000010| 48 6f 73 74 3a 20 6c 6f 63 61 6c 68 6f 73 74 3a |Host: localhost:|
//请求路径如下
/
//请求的响应内容
22:00:48.092 [nioEventLoopGroup-2-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x393520e9, L:/0:0:0:0:0:0:0:1:8080 - R:/0:0:0:0:0:0:0:1:61142] WRITE: 61B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d |HTTP/1.1 200 OK.|
|00000010| 0a 63 6f 6e 74 65 6e 74 2d 6c 65 6e 67 74 68 3a |.content-length:|
|00000020| 20 32 32 0d 0a 0d 0a 3c 68 31 3e 48 65 6c 6c 6f | 22....<h1>Hello|
|00000030| 2c 20 57 6f 72 6c 64 21 3c 2f 68 31 3e          |, World!</h1>   |
+--------+-------------------------------------------------+----------------+
//浏览器请求->浏览器自动对favicon的请求，与用户的主动请求无关，浏览器自动执行的
22:00:48.178 [nioEventLoopGroup-2-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x393520e9, L:/0:0:0:0:0:0:0:1:8080 - R:/0:0:0:0:0:0:0:1:61142] READ: 598B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 47 45 54 20 2f 66 61 76 69 63 6f 6e 2e 69 63 6f |GET /favicon.ico|
|00000010| 20 48 54 54 50 2f 31 2e 31 0d 0a 48 6f 73 74 3a | HTTP/1.1..Host:|
//请求路径如下
/favicon.ico
//请求的响应内容
22:00:48.179 [nioEventLoopGroup-2-2] DEBUG io.netty.handler.logging.LoggingHandler - [id: 0x393520e9, L:/0:0:0:0:0:0:0:1:8080 - R:/0:0:0:0:0:0:0:1:61142] WRITE: 61B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 48 54 54 50 2f 31 2e 31 20 32 30 30 20 4f 4b 0d |HTTP/1.1 200 OK.|
|00000010| 0a 63 6f 6e 74 65 6e 74 2d 6c 65 6e 67 74 68 3a |.content-length:|
|00000020| 20 32 32 0d 0a 0d 0a 3c 68 31 3e 48 65 6c 6c 6f | 22....<h1>Hello|
|00000030| 2c 20 57 6f 72 6c 64 21 3c 2f 68 31 3e          |, World!</h1>   |
+--------+-------------------------------------------------+----------------+
```

#### 4、自定义协议

##### 1、组成要素

>- **魔数**：用来在第一时间判定接收的数据是否为无效数据包
>- **版本号**：可以支持协议的升级
>- **序列化算法**：消息正文到底采用哪种序列化及反序列化方式。如：Json、Protobuf、Hessian、Jdk
> - **指令类型**：是登录、注册、单聊、群聊… 跟业务相关的消息类型
>- **请求序号**：为了双工通信，提供异步能力
>- **正文长度**：有效数据的长度
>- **消息正文**：有效数据

##### 2、自定义编码器与解码器

```java
public class MessageCodec extends ByteToMessageCodec<Message> {

    /**
     * @Description: 对Message进行编码，编码为ByteBuf类型
     * @Author: Mr.Tong
     */
    @Override
    public void encode(ChannelHandlerContext ctx, Message msg, ByteBuf out) throws Exception {
        // 设置魔数 4个字节
        out.writeBytes(new byte[]{'1', '2', '3', '4'});
        // 设置版本号 1个字节
        out.writeByte(1);
        // 设置序列化方式 1个字节 Json->0 Jdk->1
        out.writeByte(1);
        // 设置指令类型 1个字节
        out.writeByte(msg.getMessageType());
        // 设置请求序号 4个字节
        out.writeInt(msg.getSequenceId());
        // 为了补齐为16个字节，填充1个字节的数据
        out.writeByte(0xff);

        // 获得序列化后的msg
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(msg);
        byte[] bytes = bos.toByteArray();

        // 获得并设置正文长度 长度用4个字节标识
        out.writeInt(bytes.length);
        // 设置消息正文
        out.writeBytes(bytes);
    }

    /**
     * @Description: 对ByteBuf进行解码，解码为Message
     * @Author: Mr.Tong
     */
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        // 获取魔数
        int magic = in.readInt();
        // 获取版本号
        byte version = in.readByte();
        // 获得序列化方式
        byte seqType = in.readByte();
        // 获得指令类型
        byte messageType = in.readByte();
        // 获得请求序号
        int sequenceId = in.readInt();
        // 移除补齐字节
        in.readByte();
        // 获得正文长度
        int length = in.readInt();
        // 获得正文内容->进行反序列化
        byte[] bytes = new byte[length];
        in.readBytes(bytes, 0, length);
        ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bytes));
        Message message = (Message) ois.readObject();
        // 将信息放入List中，传递给下一个handler
        out.add(message);

        // 打印获得的信息正文
        System.out.println("===========魔数===========");
        System.out.println(magic);
        System.out.println("===========版本号===========");
        System.out.println(version);
        System.out.println("===========序列化方法===========");
        System.out.println(seqType);
        System.out.println("===========指令类型===========");
        System.out.println(messageType);
        System.out.println("===========请求序号===========");
        System.out.println(sequenceId);
        System.out.println("===========正文长度===========");
        System.out.println(length);
        System.out.println("===========正文===========");
        System.out.println(message);
    }
}
```

* 编码器与解码器方法源于父类`ByteToMessageCodec`，通过该类可以自定义编码器与解码器，**泛型类型为被编码与被解码的类**。此处使用了自定义类`Message`，代表消息。

```java
//继承ByteToMessageCodec
public class MessageCodec extends ByteToMessageCodec<Message>
```

* 编码器**负责将附加信息与正文信息写入到ByteBuf中**，其中附加信息**总字节数最好为2的N次方，不足需要补齐**，正文内容如果为对象，需要通过**序列化**将其放入到ByteBuf中。

* 解码器**负责将ByteBuf中的信息取出，并放入List中**，该List用于将信息传递给下一个Handler。

* 编码测试类

```java
public class TestMessageCodec {
    public static void main(String[] args) throws Exception {
        EmbeddedChannel channel = new EmbeddedChannel(
                new LoggingHandler(),
                //避免出现半包及粘包问题
                new LengthFieldBasedFrameDecoder(
                        1024, 12, 4, 0, 0),
                new MessageCodec()
        );
        LoginRequestMessage message = new LoginRequestMessage("tys", "2577297621");
        //1、测试编码
        channel.writeOutbound(message);


/*        //2、测试解码
        ByteBuf buf = ByteBufAllocator.DEFAULT.buffer();
        new MessageCodec().encode(null, message, buf);//编码消息放入buf中
        //buf切片模拟半包
        ByteBuf s1 = buf.slice(0, 100);//零拷贝
        ByteBuf s2 = buf.slice(100, buf.readableBytes() - 100);
        s1.retain(); // 引用计数 2
        channel.writeInbound(s1); // release 1 writeInbound方法会使得buf的引用计数为0，内存被释放掉
        channel.writeInbound(s2);*/
    }
}
```

测试**编码**执行结果：

```java
22:52:14 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] WRITE: 216B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 31 32 33 34 01 01 00 00 00 00 00 ff 00 00 00 c8 |1234............|
|00000010| ac ed 00 05 73 72 00 25 63 6e 2e 69 74 63 61 73 |....sr.%cn.itcas|
|00000020| 74 2e 6d 65 73 73 61 67 65 2e 4c 6f 67 69 6e 52 |t.message.LoginR|
|00000030| 65 71 75 65 73 74 4d 65 73 73 61 67 65 a0 3f 71 |equestMessage.?q|
|00000040| cb 31 45 b5 88 02 00 02 4c 00 08 70 61 73 73 77 |.1E.....L..passw|
|00000050| 6f 72 64 74 00 12 4c 6a 61 76 61 2f 6c 61 6e 67 |ordt..Ljava/lang|
|00000060| 2f 53 74 72 69 6e 67 3b 4c 00 08 75 73 65 72 6e |/String;L..usern|
|00000070| 61 6d 65 71 00 7e 00 01 78 72 00 19 63 6e 2e 69 |ameq.~..xr..cn.i|
|00000080| 74 63 61 73 74 2e 6d 65 73 73 61 67 65 2e 4d 65 |tcast.message.Me|
|00000090| 73 73 61 67 65 3d dd 19 a0 bc 07 47 cb 02 00 02 |ssage=.....G....|
|000000a0| 49 00 0b 6d 65 73 73 61 67 65 54 79 70 65 49 00 |I..messageTypeI.|
|000000b0| 0a 73 65 71 75 65 6e 63 65 49 64 78 70 00 00 00 |.sequenceIdxp...|
|000000c0| 00 00 00 00 00 74 00 0a 32 35 37 37 32 39 37 36 |.....t..25772976|
|000000d0| 32 31 74 00 03 74 79 73                         |21t..tys        |
+--------+-------------------------------------------------+----------------+
//16个字节的附加信息，其后是跟着的有效数据信息，共200个字节，0XC8是十六进制，换算为十进制就是200个字节
```

测试**解码**执行结果：

```java
22:54:43 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ: 100B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 31 32 33 34 01 01 00 00 00 00 00 ff 00 00 00 c8 |1234............|
|00000010| ac ed 00 05 73 72 00 25 63 6e 2e 69 74 63 61 73 |....sr.%cn.itcas|
|00000020| 74 2e 6d 65 73 73 61 67 65 2e 4c 6f 67 69 6e 52 |t.message.LoginR|
|00000030| 65 71 75 65 73 74 4d 65 73 73 61 67 65 a0 3f 71 |equestMessage.?q|
|00000040| cb 31 45 b5 88 02 00 02 4c 00 08 70 61 73 73 77 |.1E.....L..passw|
|00000050| 6f 72 64 74 00 12 4c 6a 61 76 61 2f 6c 61 6e 67 |ordt..Ljava/lang|
|00000060| 2f 53 74 72                                     |/Str            |
+--------+-------------------------------------------------+----------------+
22:54:43 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ COMPLETE
22:54:43 [DEBUG] [main] i.n.h.l.LoggingHandler - [id: 0xembedded, L:embedded - R:embedded] READ: 116B
         +-------------------------------------------------+
         |  0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f |
+--------+-------------------------------------------------+----------------+
|00000000| 69 6e 67 3b 4c 00 08 75 73 65 72 6e 61 6d 65 71 |ing;L..usernameq|
|00000010| 00 7e 00 01 78 72 00 19 63 6e 2e 69 74 63 61 73 |.~..xr..cn.itcas|
|00000020| 74 2e 6d 65 73 73 61 67 65 2e 4d 65 73 73 61 67 |t.message.Messag|
|00000030| 65 3d dd 19 a0 bc 07 47 cb 02 00 02 49 00 0b 6d |e=.....G....I..m|
|00000040| 65 73 73 61 67 65 54 79 70 65 49 00 0a 73 65 71 |essageTypeI..seq|
|00000050| 75 65 6e 63 65 49 64 78 70 00 00 00 00 00 00 00 |uenceIdxp.......|
|00000060| 00 74 00 0a 32 35 37 37 32 39 37 36 32 31 74 00 |.t..2577297621t.|
|00000070| 03 74 79 73                                     |.tys            |
+--------+-------------------------------------------------+----------------+
===========魔数===========
825373492
===========版本号===========
1
===========序列化方法===========
1
===========指令类型===========
0
===========请求序号===========
0
===========正文长度===========
200
===========正文===========
LoginRequestMessage(super=Message(sequenceId=0, messageType=0), username=tys, password=2577297621)
//通过上述结果可以看到，已经避免了半包问题，同时结果也可以正常的被解码
```

##### 3、@Sharable注解

为了**提高handler的复用率，可以将handler创建为handler对象**，然后在不同的channel中使用该handler对象进行处理操作。

```java
LoggingHandler loggingHandler = new LoggingHandler(LogLevel.DEBUG);
// 不同的channel中使用同一个handler对象，提高复用率
channel1.pipeline().addLast(loggingHandler);
channel2.pipeline().addLast(loggingHandler);
```

但**并不是所有的handler都能通过这种方法来提高复用率的**，例如`LengthFieldBasedFrameDecoder`。如果多个channel中使用同一个LengthFieldBasedFrameDecoder对象，则可能发生如下问题：

* channel1中收到了一个半包，LengthFieldBasedFrameDecoder发现不是一条完整的数据，则没有继续向下传播
* 此时channel2中也收到了一个半包，**因为两个channel使用了同一个LengthFieldBasedFrameDecoder，存入其中的数据刚好拼凑成了一个完整的数据包**。LengthFieldBasedFrameDecoder让该数据包继续向下传播，**最终引发错误**

所以可以看到`LengthFieldBasedFrameDecoder`存在线程安全问题，对于`LoggingHandler`并不存在线程安全问题，只是打印详细数据日志。为了提高handler的复用率，同时又避免出现一些并发问题，**Netty中原生的handler中用`@Sharable`注解来标明该handler能否在多个channel中共享。**只有带有该注解，才能通过对象的方式被共享**，否则无法被共享。**

**源码：**

```java
//LoggingHandler源码->Sharable注解
@Sharable
@SuppressWarnings({ "StringConcatenationInsideStringBufferAppend", "StringBufferReplaceableByString" })
public class LoggingHandler extends ChannelDuplexHandler {
  
//LengthFieldBasedFrameDecoder源码->没有Sharable注解
public class LengthFieldBasedFrameDecoder extends ByteToMessageDecoder {
```

> 一个Handler如果是线程安全的，不会记录上个状态信息，即无状态的，就可以使用Sharable注解，反之，不能使用该注解。**一个Handler是不是无状态的，要根据这个Handler的功能考虑。**

##### 4、使用@Sharable注解

**自定义编解码器能否使用@Sharable注解，这需要根据自定义的handler的处理逻辑进行分析。**

我们的MessageCodec本身接收的是LengthFieldBasedFrameDecoder处理之后的数据，那么数据肯定是完整的，按分析来说是可以添加@Sharable注解的，但是实际情况我们并**不能**添加该注解，会抛出异常信息。

```java
Exception in thread "main" java.lang.IllegalStateException: ChannelHandler cn.itcast.protocol.MessageCodec is not allowed to be shared
```

这是Netty的默认保护机制，会认为我们自定义的Handler不能在各个channel中进行共享，担心我们无法处理好线程安全问题，分析源码（查看父类`ByteToMessageCodec`）如下：

```java
/**
 * A Codec for on-the-fly encoding/decoding of bytes to messages and vise-versa.
 *
 * This can be thought of as a combination of {@link ByteToMessageDecoder} and {@link MessageToByteEncoder}.
 *
 * Be aware that sub-classes of {@link ByteToMessageCodec} <strong>MUST NOT</strong>
 * annotated with {@link @Sharable}.
 */
public abstract class ByteToMessageCodec<I> extends ChannelDuplexHandler
//上面的注释明确说明该类的子类不能使用该注解
```

**这就意味着ByteToMessageCodec不能被多个channel所共享的，因为该类的目标是：将ByteBuf转化为Message，意味着传进该handler的数据还未被处理过，所以传过来的ByteBuf可能并不是完整的数据，如果共享则会出现问题。**

**如果想要共享，需要怎么办呢？**继承**MessageToMessageDecoder**即可。**该类的目标是：将已经被处理的完整数据再次被处理。**传过来的Message**如果是被处理过的完整数据**，那么被共享也就不会出现问题了，也就可以使用@Sharable注解了。实现方式与ByteToMessageCodec类似。

```java
@ChannelHandler.Sharable
/**
 * 必须和 LengthFieldBasedFrameDecoder 一起使用，确保接到的 ByteBuf 消息是完整的
 */
public class MessageSharableCodec extends MessageToMessageCodec<ByteBuf, Message> {
    @Override
    protected void encode(ChannelHandlerContext ctx, Message msg, List<Object> out) throws Exception {
        ...
    }

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf msg, List<Object> out) throws Exception {
		...
    }
}
```

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
        out.writeByte(0);
        // 4. 1 字节的指令类型
        out.writeByte(msg.getMessageType());
        // 5. 4 个字节
        out.writeInt(msg.getSequenceId());
        // 无意义，对齐填充
        out.writeByte(0xff);
        // 6. 获取内容的字节数组
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(msg);
        byte[] bytes = bos.toByteArray();
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
        ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bytes));
        Message message = (Message) ois.readObject();
        log.debug("{}, {}, {}, {}, {}, {}", magicNum, version, serializerType, messageType, sequenceId, length);
        log.debug("{}", message);
        out.add(message);
    }
}
```

### 3、在线聊天室

#### 1、聊天室业务

**用户管理-`UserService`**

```java
public interface UserService {

    /**
     * 登录
     * @param username 用户名
     * @param password 密码
     * @return 登录成功返回 true, 否则返回 false
     */
    boolean login(String username, String password);
}

```

**聊天组会话管理-`GroupSession`**

```java
public interface GroupSession {

    /**
     * 创建一个聊天组, 如果不存在才能创建成功, 否则返回 null
     * @param name 组名
     * @param members 成员
     * @return 成功时返回组对象, 失败返回 null
     */
    Group createGroup(String name, Set<String> members);

    /**
     * 加入聊天组
     * @param name 组名
     * @param member 成员名
     * @return 如果组不存在返回 null, 否则返回组对象
     */
    Group joinMember(String name, String member);

    /**
     * 移除组成员
     * @param name 组名
     * @param member 成员名
     * @return 如果组不存在返回 null, 否则返回组对象
     */
    Group removeMember(String name, String member);

    /**
     * 移除聊天组
     * @param name 组名
     * @return 如果组不存在返回 null, 否则返回组对象
     */
    Group removeGroup(String name);

    /**
     * 获取组成员
     * @param name 组名
     * @return 成员集合, 没有成员会返回 empty set
     */
    Set<String> getMembers(String name);

    /**
     * 获取组成员的 channel 集合, 只有在线的 channel 才会返回
     * @param name 组名
     * @return 成员 channel 集合
     */
    List<Channel> getMembersChannel(String name);
}

```

**会话管理-`Session`**

```java
public interface Session {

    /**
     * 绑定会话
     * @param channel 哪个 channel 要绑定会话
     * @param username 会话绑定用户
     */
    void bind(Channel channel, String username);

    /**
     * 解绑会话
     * @param channel 哪个 channel 要解绑会话
     */
    void unbind(Channel channel);

    /**
     * 获取属性
     * @param channel 哪个 channel
     * @param name 属性名
     * @return 属性值
     */
    Object getAttribute(Channel channel, String name);

    /**
     * 设置属性
     * @param channel 哪个 channel
     * @param name 属性名
     * @param value 属性值
     */
    void setAttribute(Channel channel, String name, Object value);

    /**
     * 根据用户名获取 channel
     * @param username 用户名
     * @return channel
     */
    Channel getChannel(String username);
}

```

**客户端代码**

```java
@Slf4j
public class ChatClient {
    public static void main(String[] args) {
        NioEventLoopGroup group = new NioEventLoopGroup();
      //日志
        LoggingHandler LOGGING_HANDLER = new LoggingHandler(LogLevel.DEBUG);
      //消息编解码器
        MessageCodecSharable MESSAGE_CODEC = new MessageCodecSharable();
        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(group);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                  //处理粘包-半包问题，确保获得的是完整的每一条消息
                    ch.pipeline().addLast(new ProcotolFrameDecoder());
                  //日志
                    ch.pipeline().addLast(LOGGING_HANDLER);
                  //消息编解码器
                    ch.pipeline().addLast(MESSAGE_CODEC);
                }
            });
            Channel channel = bootstrap.connect("localhost", 8080).sync().channel();
            channel.closeFuture().sync();
        } catch (Exception e) {
            log.error("client error", e);
        } finally {
            group.shutdownGracefully();
        }
    }
}
```

**基于长度字段的消息解码器**

```java
//继承LengthFieldBasedFrameDecoder
public class ProcotolFrameDecoder extends LengthFieldBasedFrameDecoder {

    public ProcotolFrameDecoder() {
        this(1024, 12, 4, 0, 0);
    }

    public ProcotolFrameDecoder(int maxFrameLength, int lengthFieldOffset, int lengthFieldLength, int lengthAdjustment, int initialBytesToStrip) {
        super(maxFrameLength, lengthFieldOffset, lengthFieldLength, lengthAdjustment, initialBytesToStrip);
    }
}
```

**服务器端代码**

```java
@Slf4j
public class ChatServer {
    public static void main(String[] args) {
        NioEventLoopGroup boss = new NioEventLoopGroup();
        NioEventLoopGroup worker = new NioEventLoopGroup();
      //可以共享-日志-消息编解码器
        LoggingHandler LOGGING_HANDLER = new LoggingHandler(LogLevel.DEBUG);
        MessageCodecSharable MESSAGE_CODEC = new MessageCodecSharable();
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                  //获得的是完整的一条消息记录-解决粘包及半包问题
                    ch.pipeline().addLast(new ProcotolFrameDecoder());
                    ch.pipeline().addLast(LOGGING_HANDLER);
                    ch.pipeline().addLast(MESSAGE_CODEC);
                }
            });
            Channel channel = serverBootstrap.bind(8080).sync().channel();
            channel.closeFuture().sync();
        } catch (InterruptedException e) {
            log.error("server error", e);
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }
}
```

#### 2、登陆

**客户端代码**

思路-新开辟一个线程实现建立连接之后发送登陆请求及后续操作，登陆请求消息体构建之后发送到服务器，服务器进行验证，此时客户端处于阻塞状态。当读取到服务器的响应之后，关闭新开辟线程的阻塞状态，向下执行，这里的线程同步可以使用`CountDownLatch`。

```java
@Slf4j
public class ChatClient {
    public static void main(String[] args) {
        NioEventLoopGroup group = new NioEventLoopGroup();
        LoggingHandler LOGGING_HANDLER = new LoggingHandler(LogLevel.DEBUG);
        MessageCodecSharable MESSAGE_CODEC = new MessageCodecSharable();

        //使用CountDownLatch实现线程通信
        CountDownLatch WAIT_FOR_LOGIN = new CountDownLatch(1);
        //登陆状态标记-默认是未登陆状态
        AtomicBoolean LOGIN = new AtomicBoolean(false);

        try {
            Bootstrap bootstrap = new Bootstrap();
            bootstrap.channel(NioSocketChannel.class);
            bootstrap.group(group);
            bootstrap.handler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    //获得一条完整的消息
                    ch.pipeline().addLast(new ProcotolFrameDecoder());
                    //打印日志
//                    ch.pipeline().addLast(LOGGING_HANDLER);
                    //消息编解码
                    ch.pipeline().addLast(MESSAGE_CODEC);
                    ch.pipeline().addLast(new ChannelInboundHandlerAdapter() {

                        //读取服务器响应
                        @Override
                        public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
                            if (msg instanceof LoginResponseMessage) {
                                LoginResponseMessage response = (LoginResponseMessage) msg;
                                if (response.isSuccess()) {
                                    //登陆成功-设置登陆状态标记
                                    LOGIN.set(true);
                                }
                                //登陆后-唤醒登陆线程
                                WAIT_FOR_LOGIN.countDown();
                            }
                        }

                        //连接成功进行登陆操作
                        @Override
                        public void channelActive(ChannelHandlerContext ctx) throws Exception {
                            //新开辟一个线程执行登陆操作
                            new Thread(() -> {
                                //获取用户输入的用户名和密码
                                Scanner scanner = new Scanner(System.in);
                                System.out.println("请输入用户名:");
                                String username = scanner.nextLine();
                                System.out.println("请输入密码:");
                                String password = scanner.nextLine();

                                //构造登陆请求
                                LoginRequestMessage loginRequestMessage = new LoginRequestMessage(username, password);

                                //将登陆请求发送到channel中
                                ctx.writeAndFlush(loginRequestMessage);

                                //当前线程等待服务器验证用户名和密码
                                //阻塞-直到登陆成功后CountDownLatch被设置为0-即:WAIT_FOR_LOGIN.countDown();
                                try {
                                    WAIT_FOR_LOGIN.await();
                                } catch (InterruptedException e) {
                                    e.printStackTrace();
                                }

                                //判断登陆状态
                                if (!LOGIN.get()) {//登陆失败
                                    //关闭channel
                                    ctx.channel().close();
                                    return;
                                }

                                //登陆成功
                                while (true) {
                                    System.out.println("==================================");
                                    System.out.println("send [username] [content]");
                                    System.out.println("gsend [group name] [content]");
                                    System.out.println("gcreate [group name] [m1,m2,m3...]");
                                    System.out.println("gmembers [group name]");
                                    System.out.println("gjoin [group name]");
                                    System.out.println("gquit [group name]");
                                    System.out.println("quit");
                                    System.out.println("==================================");
                                    try {
                                        Thread.sleep(1000000);
                                    } catch (InterruptedException e) {
                                        e.printStackTrace();
                                    }
                                }

                            }, "LoginThread").start();
                        }
                    });
                }
            });
            Channel channel = bootstrap.connect("localhost", 8080).sync().channel();
            channel.closeFuture().sync();
        } catch (Exception e) {
            log.error("client error", e);
        } finally {
            group.shutdownGracefully();
        }
    }
}

```

**服务器端代码**

思路-自定义添加处理登陆请求的`Handler`。

```java
@Slf4j
public class ChatServer {
    public static void main(String[] args) {
        //boss处理连接
        NioEventLoopGroup boss = new NioEventLoopGroup();
        //worker处理读写-两个线程
        NioEventLoopGroup worker = new NioEventLoopGroup(2);

        LoggingHandler LOGGING_HANDLER = new LoggingHandler(LogLevel.DEBUG);
        MessageCodecSharable MESSAGE_CODEC = new MessageCodecSharable();


        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    //完整消息
                    ch.pipeline().addLast(new ProcotolFrameDecoder());
                    //日志
//                    ch.pipeline().addLast(LOGGING_HANDLER);
                    //解码
                    ch.pipeline().addLast(MESSAGE_CODEC);
                    ch.pipeline().addLast("login-request", new LoginRequestMessageHandler());
                }
            });
            Channel channel = serverBootstrap.bind(8080).sync().channel();
            channel.closeFuture().sync();
        } catch (InterruptedException e) {
            log.error("server error", e);
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }
}

```

**自定义的登陆请求处理器**

```java
/**
 * @Name: LoginRequestMessageHandler
 * @Description: 处理登陆请求的handler
 * @Author: Mr.Tong
 */
public class LoginRequestMessageHandler extends SimpleChannelInboundHandler<LoginRequestMessage> {


    @Override
    protected void channelRead0(ChannelHandlerContext ctx, LoginRequestMessage msg) throws Exception {
        //验证登陆请求
        String username = msg.getUsername();
        String password = msg.getPassword();
        UserService userService = UserServiceFactory.getUserService();
        boolean login = userService.login(username, password);

        LoginResponseMessage loginResponse;
        //判断登陆状态
        if (login) {
            loginResponse = new LoginResponseMessage(true, "登陆成功");
        } else {
            loginResponse = new LoginResponseMessage(false, "登陆失败");
        }

        //将服务器的用户名密码验证响应写入channel中
        ctx.writeAndFlush(loginResponse);

    }
}
```

**登陆成功：**

```java
请输入用户名:
zhangsan
请输入密码:
123
20:37:47 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - LoginResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=1), success=true, reason=登陆成功))
==================================
send [username] [content]
gsend [group name] [content]
gcreate [group name] [m1,m2,m3...]
gmembers [group name]
gjoin [group name]
gquit [group name]
quit
==================================
```

**登陆失败：**

```java
请输入用户名:
zhangsan
请输入密码:
234
20:38:25 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - LoginResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=1), success=false, reason=登陆失败))

Process finished with exit code 0
```

#### 3、单聊

客户端应该匹配用户输入的命令，从而实现不同的功能。

```java
//登陆成功
while (true) {
    System.out.println("==================================");
    System.out.println("send [username] [content]");
    System.out.println("gsend [group name] [content]");
    System.out.println("gcreate [group name] [m1,m2,m3...]");
    System.out.println("gmembers [group name]");
    System.out.println("gjoin [group name]");
    System.out.println("gquit [group name]");
    System.out.println("quit");
    System.out.println("==================================");
    //获取用户输入的命令
    String command = scanner.nextLine();
    String[] messageData = command.split(" ");
    //匹配用户的命令
    switch (messageData[0]) {
        //单聊发送消息
        case "send":
            ChatRequestMessage chatRequestMessage = new ChatRequestMessage(username, messageData[1], messageData[2]);
            ctx.channel().writeAndFlush(chatRequestMessage);
            break;
        case "gsend":
            GroupChatRequestMessage groupChatRequestMessage = new GroupChatRequestMessage(username, messageData[1], messageData[2]);
            ctx.channel().writeAndFlush(groupChatRequestMessage);
            break;
        case "gcreate":
            String[] split = messageData[2].split(",");
            //小组成员-使用set集合，防止出现两个相同的成员
            HashSet<String> members = new HashSet<>(Arrays.asList(split));
            members.add(username);//加入当前用户自己
            //建群请求
            GroupCreateRequestMessage groupCreateRequestMessage = new GroupCreateRequestMessage(messageData[1], members);
            ctx.writeAndFlush(groupCreateRequestMessage);
            break;
        case "gmembers":
            GroupMembersRequestMessage groupMembersRequestMessage = new GroupMembersRequestMessage(messageData[1]);
            ctx.writeAndFlush(groupMembersRequestMessage);
            break;
        case "gjoin":
            GroupJoinRequestMessage groupJoinRequestMessage = new GroupJoinRequestMessage(username, messageData[1]);
            ctx.writeAndFlush(groupJoinRequestMessage);
            break;
        case "gquit":
            GroupQuitRequestMessage groupQuitRequestMessage = new GroupQuitRequestMessage(username, messageData[1]);
            ctx.writeAndFlush(groupQuitRequestMessage);
            break;
        case "quit":
            ctx.channel().close();
            return;
    }
}
```

服务器端首先应该记录`channel`和用户名的映射关系，这样A向B发送消息，就可以找到B的`channel`，从而实现写入消息。

应该在哪里记录？**在`LoginRequestMessageHandler`中记录，`channel`和用户名的映射关系在登陆的时候就已经确定了，所以登陆成功之后就需要记录该关系。**

```java
@ChannelHandler.Sharable
public class LoginRequestMessageHandler extends SimpleChannelInboundHandler<LoginRequestMessage> {


    @Override
    protected void channelRead0(ChannelHandlerContext ctx, LoginRequestMessage msg) throws Exception {
        //验证登陆请求
        String username = msg.getUsername();
        String password = msg.getPassword();
        UserService userService = UserServiceFactory.getUserService();
        boolean login = userService.login(username, password);

        LoginResponseMessage loginResponse;
        //判断登陆状态
        if (login) {
            loginResponse = new LoginResponseMessage(true, "登陆成功");
            //记录channel和username的映射关系-通过会话管理器
            SessionFactory.getSession().bind(ctx.channel(),username);
        } else {
            loginResponse = new LoginResponseMessage(false, "登陆失败");
        }

        //将服务器的用户名密码验证响应写入channel中
        ctx.writeAndFlush(loginResponse);

    }
}
```

添加单聊的Handler，代码如下：

```java
@ChannelHandler.Sharable
public class ChatRequestMessageHandler extends SimpleChannelInboundHandler<ChatRequestMessage> {


    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ChatRequestMessage msg) throws Exception {
        //服务器拿到客户端发送过来的聊天消息
        String to = msg.getTo();
        Channel channel = SessionFactory.getSession().getChannel(to);
        if (channel != null) {//用户在线
            //服务器给to用户写入消息
            channel.writeAndFlush(new ChatResponseMessage(msg.getFrom(), msg.getContent()));
        } else {//用户不在线或者不存在
            //服务器给from用户写入消息
            ctx.writeAndFlush(new ChatResponseMessage(false, "用户不在线或者不存在"));
        }


    }
}
```

服务端代码优化：**将所有可以共享的`Handler`抽取出来优化代码。**

```java
@Slf4j
public class ChatServer {
    public static void main(String[] args) {
        //boss处理连接
        NioEventLoopGroup boss = new NioEventLoopGroup();
        //worker处理读写-两个线程
        NioEventLoopGroup worker = new NioEventLoopGroup(2);

        LoggingHandler LOGGING_HANDLER = new LoggingHandler(LogLevel.DEBUG);
        MessageCodecSharable MESSAGE_CODEC = new MessageCodecSharable();
        LoginRequestMessageHandler LOGIN_HANDLER = new LoginRequestMessageHandler();
        ChatRequestMessageHandler CHAT_HANDLER = new ChatRequestMessageHandler();


        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.channel(NioServerSocketChannel.class);
            serverBootstrap.group(boss, worker);
            serverBootstrap.childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) throws Exception {
                    ch.pipeline().addLast(new ProcotolFrameDecoder());
                    ch.pipeline().addLast(MESSAGE_CODEC);
                    ch.pipeline().addLast(LOGIN_HANDLER);
                    ch.pipeline().addLast(CHAT_HANDLER);
                }
            });
            Channel channel = serverBootstrap.bind(8080).sync().channel();
            channel.closeFuture().sync();
        } catch (InterruptedException e) {
            log.error("server error", e);
        } finally {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }
}
```

> 注意：
>
> 上面自定义的Handler都使用了Sharable注解，什么情况下需要使用该注解呢？
>
> 标有@Sharable的Handler，代表了他是一个可以被分享的Handler，这就是说服务器注册了这个Handler后，可以分享给多个客户端使用，如果没有使用该注解，则每次客户端请求时，都必须重新创建一个Handler。
>
> 正常情况下同一个ChannelHandler的不同的实例会被添加到不同的Channel管理的管线里面的，但是如果你需要全局统计一些信息，比如所有连接报错次数等，这时候你可能需要使用单例的ChannelHandler，需要注意的是这时候ChannelHandler上需要添加@Sharable注解。
>
> 参考：
>
> [你真的了解Netty中@Sharable？ - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/48341790)
>
> [netty的@Sharable注解含义 - 简书 (jianshu.com)](https://www.jianshu.com/p/cfe6136a9cb8)
>
> [java - Netty @Sharable_个人文章 - SegmentFault 思否](https://segmentfault.com/a/1190000038437243)

**实现效果：**

发送方-zhangsan

```java
send lisi nihao!
```

接收方-lisi

```java
09:07:48 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - ChatResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=3), success=false, reason=null), from=zhangsan, content=nihao!)
```

#### 4、群聊创建

**客户端代码：**

```java
case "gcreate":
    String[] split = messageData[2].split(",");
    //小组成员-使用set集合，防止出现两个相同的成员
    HashSet<String> members = new HashSet<>(Arrays.asList(split));
    members.add(username);//不要忘记将自己拉入到群聊中
    GroupCreateRequestMessage groupCreateRequestMessage = new GroupCreateRequestMessage(messageData[1], members);
    ctx.writeAndFlush(groupCreateRequestMessage);
    break;
```

**服务器端代码：**

```java
GroupCreateRequestMessageHandler GROUP_CREATE_HANDLER = new GroupCreateRequestMessageHandler();

ch.pipeline().addLast(GROUP_CREATE_HANDLER);
```

**群组创建请求消息的Handler：**

```java
@ChannelHandler.Sharable
public class GroupCreateRequestMessageHandler extends SimpleChannelInboundHandler<GroupCreateRequestMessage> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, GroupCreateRequestMessage msg) throws Exception {

        //获取群组管理器
        GroupSession groupSession = GroupSessionFactory.getGroupSession();
        //创建群组-如果存在群名对应的群组，则直接返回群组，如果不存在就会创建群名对应的群组，并且返回null
        Group group = groupSession.createGroup(msg.getGroupName(), msg.getMembers());

        if (group == null) {//创建成功
            //向创建者发送创建成功的消息
            ctx.channel().writeAndFlush(new GroupCreateResponseMessage(true, msg.getGroupName() + "创建成功"));
            //向群组的其他人发送消息-被拉入群中

            List<Channel> membersChannel = groupSession.getMembersChannel(msg.getGroupName());
            membersChannel.forEach(channel -> channel.writeAndFlush(new GroupCreateResponseMessage(true, "您已经被拉入" + msg.getGroupName())));
        } else {
            //向创建者发送创建失败的消息
            ctx.channel().writeAndFlush(new GroupCreateResponseMessage(false, msg.getGroupName() + "已经存在"));
        }
    }
}
```

运行效果：

`zhangsan`

```java
gcreate 群聊1 lisi,wangwu
10:51:29 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - GroupCreateResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=5), success=true, reason=群聊1创建成功))
10:51:29 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - GroupCreateResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=5), success=true, reason=您已经被拉入群聊1))
```

`lisi`

```java
10:51:29 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - GroupCreateResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=5), success=true, reason=您已经被拉入群聊1))
```

`wangwu`

```java
10:51:29 [DEBUG] [nioEventLoopGroup-2-1] c.i.p.MessageCodecSharable - GroupCreateResponseMessage(super=AbstractResponseMessage(super=Message(sequenceId=0, messageType=5), success=true, reason=您已经被拉入群聊1))
```

> Map中的putIfAbsent方法：
>
> ```java
> default V putIfAbsent(K key, V value) {
>     V v = get(key);
>     if (v == null) {
>         v = put(key, value);
>       //此时的v经过put之后仍然是null值
>     }
> 
>     return v;
> }
> ```
>
> 如果key对应的value存在，就会直接返回该value，如果不存在，会将新的key和value存入到map中，返回null值。

#### 5、群聊消息发送

```java
@ChannelHandler.Sharable
public class GroupChatRequestMessageHandler extends SimpleChannelInboundHandler<GroupChatRequestMessage> {


    @Override
    protected void channelRead0(ChannelHandlerContext ctx, GroupChatRequestMessage msg) throws Exception {
        String groupName = msg.getGroupName();
        String from = msg.getFrom();
        String content = msg.getContent();
        //获取群组成员的channel
        GroupSession groupSession = GroupSessionFactory.getGroupSession();
        List<Channel> membersChannel = groupSession.getMembersChannel(groupName);
        //遍历channel发送消息
        membersChannel.forEach(channel -> channel.writeAndFlush(new GroupChatResponseMessage(from, content)));
        //告诉用户发送成功
        ctx.channel().writeAndFlush(new GroupChatResponseMessage(true, "发送消息成功"));

    }
}

```

```java
GroupChatRequestMessageHandler GROUP_CHAT_HANDLER = new GroupChatRequestMessageHandler();
ch.pipeline().addLast(GROUP_CHAT_HANDLER);
```

#### 6、获取群聊内所有成员

```java
@ChannelHandler.Sharable
public class GroupMembersRequestMessageHandler extends SimpleChannelInboundHandler<GroupMembersRequestMessage> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, GroupMembersRequestMessage msg) throws Exception {
        String groupName = msg.getGroupName();

        GroupSession groupSession = GroupSessionFactory.getGroupSession();
        Set<String> members = groupSession.getMembers(groupName);

        ctx.channel().writeAndFlush(new GroupMembersResponseMessage(members));

        //上述代码是所有的客户端都可以查看某一个群聊的所有成员
        //业务逻辑来讲，只有群聊内的成员才可以查看群成员，后续可以进行优化

    }
}
```

```java
GroupMembersRequestMessageHandler GROUP_MEMBERS_HANDLER = new GroupMembersRequestMessageHandler();
ch.pipeline().addLast(GROUP_MEMBERS_HANDLER);
```

#### 7、加入群聊

```java
@ChannelHandler.Sharable
public class GroupJoinRequestMessageHandler extends SimpleChannelInboundHandler<GroupJoinRequestMessage> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, GroupJoinRequestMessage msg) throws Exception {
        //获取新加入的用户及群聊信息
        String username = msg.getUsername();
        String groupName = msg.getGroupName();

        GroupSession groupSession = GroupSessionFactory.getGroupSession();
        Group group = groupSession.joinMember(groupName, username);
        if (group != null) {
            //给用户发送加入成功的消息
            ctx.channel().writeAndFlush(new GroupJoinResponseMessage(true, "加入群聊成功"));
            //通知群聊的所有用户
            List<Channel> membersChannel = groupSession.getMembersChannel(groupName);
            membersChannel.forEach(channel -> channel.writeAndFlush(new GroupJoinResponseMessage(true, username + "加入了群聊")));
        }


    }
}
```

```java
GroupJoinRequestMessageHandler GROUP_JOIN_HANDLER = new GroupJoinRequestMessageHandler();
ch.pipeline().addLast(GROUP_JOIN_HANDLER);
```

#### 8、退出群聊

```java
@ChannelHandler.Sharable
public class GroupQuitRequestMessageHandler extends SimpleChannelInboundHandler<GroupQuitRequestMessage> {

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, GroupQuitRequestMessage msg) throws Exception {
        String username = msg.getUsername();
        String groupName = msg.getGroupName();
        GroupSession groupSession = GroupSessionFactory.getGroupSession();
        Group group = groupSession.removeMember(groupName, username);

        if (group != null) {
            ctx.writeAndFlush(new GroupQuitResponseMessage(true, "退出群聊成功"));
            //通知其他人
            List<Channel> membersChannel = groupSession.getMembersChannel(groupName);
            membersChannel.forEach(channel -> channel.writeAndFlush(new GroupQuitResponseMessage(true, username + "退出群聊")));

        }


    }
}

```

```java
GroupQuitRequestMessageHandler GROUP_QUIT_HANDLER = new GroupQuitRequestMessageHandler();
ch.pipeline().addLast(GROUP_QUIT_HANDLER);
```

#### 9、退出聊天室

> 客户端退出分为两种（服务器需要捕捉到两种情况都进行处理）：
>
> 1、正常退出-channel.close()
>
> 2、异常退出-客户端强制关闭channel

```java
@Slf4j
@ChannelHandler.Sharable
public class QuitHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        //正常退出的情况
        SessionFactory.getSession().unbind(ctx.channel());//解绑
        log.debug("{} 已经断开", ctx.channel());
    }


    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        //异常退出的情况
        SessionFactory.getSession().unbind(ctx.channel());//解绑
        log.debug("{} 已经异常断开-异常信息{}", ctx.channel(), cause.getMessage());
    }
}
```

> **强制退出客户端**似乎不能触发`exceptionCaught`的情况。
>
> 关于`exceptionCaught`可参考：[Netty源码分析之ChannelPipeline(五)—异常事件的传播 - DaFanJoy - 博客园 (cnblogs.com)](https://www.cnblogs.com/dafanjoy/p/12547599.html)

#### 10、空闲检测

> 连接假死

**原因**

- 网络设备出现故障，例如网卡，机房等，底层的 TCP 连接已经断开了，但应用程序没有感知到，仍然占用着资源
- 公网网络不稳定，出现丢包，如果连续出现丢包，这时现象就是客户端数据发不出去，服务端也一直收不到数据，会白白地消耗资源
- 应用程序线程阻塞，无法进行数据读写

**问题**

- 假死的连接占用的资源不能自动释放
- 向假死的连接发送数据，得到的反馈是发送超时

> 解决方法

可以添加`IdleStateHandler`对空闲时间进行检测，通过构造函数可以传入三个参数

- readerIdleTimeSeconds 读空闲经过的秒数
- writerIdleTimeSeconds 写空闲经过的秒数
- allIdleTimeSeconds 读和写空闲经过的秒数

当指定时间内未发生读或写事件时，会触发特定事件

- 读空闲会触发`READER_IDLE`
- 写空闲会触发`WRITE_IDLE`
- 读和写空闲会触发`ALL_IDEL`

服务器端检测读空闲时间

```java
// 用于空闲连接的检测，5s内未读到数据，会触发READ_IDLE事件
ch.pipeline().addLast(new IdleStateHandler(5, 0, 0));
// 添加双向处理器，负责处理READER_IDLE事件
ch.pipeline().addLast(new ChannelDuplexHandler() {
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        // 获得事件
        IdleStateEvent event = (IdleStateEvent) evt;
        if (event.state() == IdleState.READER_IDLE) {
            log.debug("建立连接之后【并不是登陆之后】-服务器已经5秒没有读到数据了...");
            //关闭当前连接
            ctx.channel().close();
        }
    }
});
```

- 使用`IdleStateHandler`进行空闲检测
- 使用双向处理器`ChannelDuplexHandler`对入站与出站事件进行处理
  - `IdleStateHandler`中的事件为特殊事件，需要实现`ChannelDuplexHandler`的`userEventTriggered`方法，判断事件类型并自定义处理方式，来对事件进行处理

为**避免因非网络等原因引发的READ_IDLE事件**，比如网络情况良好，只是用户本身没有输入数据，这时发生READ_IDLE事件，**直接让服务器断开连接是不可取的**。为避免此类情况，需要在**客户端向服务器发送心跳包**，发送频率要**小于**服务器设置的`IdleTimeSeconds`，一般设置为其值的一半。

上面的代码中，客户端和服务器端建立连接之后的5秒，客户端并没有因为网络问题而向服务器发送不了消息，而是因为客户端在输入用户名和密码的时候阻塞了，这个时候服务器就直接把这个连接关掉了，误伤了客户端，所以需要在客户端建立连接之后（不是登陆之后），就要发送心跳包给服务器，用于证明自己不是因为网络问题而发不过去消息。

```java
//连接建立
09:47:05 [DEBUG] [nioEventLoopGroup-3-1] i.n.h.l.LoggingHandler - [id: 0xb8424f09, L:/127.0.0.1:8080 - R:/127.0.0.1:51412] REGISTERED
09:47:05 [DEBUG] [nioEventLoopGroup-3-1] i.n.h.l.LoggingHandler - [id: 0xb8424f09, L:/127.0.0.1:8080 - R:/127.0.0.1:51412] ACTIVE
  //5秒之后没有收到读消息
09:47:10 [DEBUG] [nioEventLoopGroup-3-1] c.i.s.ChatServer - 建立连接之后【并不是登陆之后】-服务器已经5秒没有读到数据了...
  //关闭当前连接，客户端无法实现登陆
09:47:10 [DEBUG] [nioEventLoopGroup-3-1] i.n.h.l.LoggingHandler - [id: 0xb8424f09, L:/127.0.0.1:8080 - R:/127.0.0.1:51412] CLOSE
09:47:10 [DEBUG] [nioEventLoopGroup-3-1] i.n.h.l.LoggingHandler - [id: 0xb8424f09, L:/127.0.0.1:8080 ! R:/127.0.0.1:51412] INACTIVE
09:47:10 [DEBUG] [nioEventLoopGroup-3-1] i.n.h.l.LoggingHandler - [id: 0xb8424f09, L:/127.0.0.1:8080 ! R:/127.0.0.1:51412] UNREGISTERED
```

正确的处理方式应该在客户端添加写空闲时间的检测，连接建立后，到达指定时间如果没有写入数据，就会向服务器写入心跳数据包，代码如下：

```java
// 发送心跳包，让服务器知道客户端在线
// 建立连接之后，3s未发生WRITER_IDLE，就像服务器发送心跳包
// 该值为服务器端设置的READER_IDLE触发时间的一半左右
ch.pipeline().addLast(new IdleStateHandler(0, 3, 0));
ch.pipeline().addLast(new ChannelDuplexHandler() {
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        IdleStateEvent event = (IdleStateEvent) evt;
        if (event.state() == IdleState.WRITER_IDLE) {
            // log.debug("建立连接之后，客户端3秒中没有发送消息了，发送心跳包...");
            // 发送心跳包
            ctx.writeAndFlush(new PingMessage());
        }
    }
});
```

#### 11、项目完整代码

>  https://gitee.com/oucystong/netty-chat.git

