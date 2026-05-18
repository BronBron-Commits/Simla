using System.Diagnostics;
using System.Drawing;
using System.Net.Http;
using System.Windows.Forms;

namespace SimlaLauncher;

internal sealed record DemoDefinition(string Id, string Title, string Page, string Description);

internal static class DemoCatalog
{
    private static readonly IReadOnlyList<DemoDefinition> ItemsInternal =
    [
        new("docs", "Docs", "docs.html", "Open the Simla docs landing page."),
        new("voxel", "Voxel World", "voxel_world.html", "Open the voxel and terrain runtime."),
        new("firstperson", "First Person Viewer", "simla3d_first_person.html", "Open the first-person Simla viewer.")
    ];

    public static IReadOnlyList<DemoDefinition> Items => ItemsInternal;

    public static bool TryGet(string id, out DemoDefinition demo)
    {
        demo = ItemsInternal.FirstOrDefault(item => string.Equals(item.Id, id, StringComparison.OrdinalIgnoreCase))!;
        return demo is not null;
    }
}

internal static class DemoServiceLauncher
{
    private static readonly HttpClient HttpClient = new() { Timeout = TimeSpan.FromSeconds(2) };

    public static async Task LaunchAsync(DemoDefinition demo)
    {
        await EnsureServerReadyAsync();
        var url = BuildDemoUrl(demo.Page);
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    public static async Task EnsureServerReadyAsync()
    {
        if (await IsServerReadyAsync())
        {
            return;
        }

        StartServerProcess();

        for (var attempt = 0; attempt < 20; attempt++)
        {
            await Task.Delay(500);
            if (await IsServerReadyAsync())
            {
                return;
            }
        }

        throw new InvalidOperationException("Simla server did not become ready in time. Start Simla Server manually and try again.");
    }

    private static string BuildDemoUrl(string page) => $"http://localhost:8080/{page}";

    private static string RepoRoot => AppContext.BaseDirectory;

    private static async Task<bool> IsServerReadyAsync()
    {
        try
        {
            using var response = await HttpClient.GetAsync("http://localhost:8080/", HttpCompletionOption.ResponseHeadersRead);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static void StartServerProcess()
    {
        var serveCommand = $"/c start \"Simla Server\" /min cmd /c \"cd /d \"\"{RepoRoot}\"\" && node serve.js\"";
        Process.Start(new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = serveCommand,
            WorkingDirectory = RepoRoot,
            UseShellExecute = false,
            CreateNoWindow = true
        });
    }
}

internal sealed class LauncherForm : Form
{
    private static readonly Color AppBackground = Color.FromArgb(12, 14, 20);
    private static readonly Color SurfaceBackground = Color.FromArgb(24, 28, 38);
    private static readonly Color CardBackground = Color.FromArgb(30, 36, 48);
    private static readonly Color CardBorder = Color.FromArgb(66, 76, 96);
    private static readonly Color Accent = Color.FromArgb(88, 166, 255);
    private static readonly Color AccentMuted = Color.FromArgb(28, 50, 78);
    private static readonly Color PrimaryText = Color.FromArgb(240, 244, 252);
    private static readonly Color SecondaryText = Color.FromArgb(156, 163, 175);

    private readonly FlowLayoutPanel _cardPanel;
    private readonly Label _statusLabel;

    public LauncherForm()
    {
        Text = "Simla Launcher";
        StartPosition = FormStartPosition.CenterScreen;
        WindowState = FormWindowState.Maximized;
        MinimumSize = new Size(1100, 700);
        BackColor = AppBackground;
        ForeColor = PrimaryText;
        KeyPreview = true;

        var shell = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = AppBackground,
            Padding = new Padding(28),
            ColumnCount = 2,
            RowCount = 1
        };
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 38F));
        shell.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 62F));

        var heroPanel = CreateHeroPanel();
        var libraryPanel = CreateLibraryPanel();

        _cardPanel = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            AutoScroll = true,
            WrapContents = true,
            FlowDirection = FlowDirection.LeftToRight,
            BackColor = SurfaceBackground,
            Padding = new Padding(0, 0, 8, 0),
            Margin = new Padding(0)
        };

        foreach (var demo in DemoCatalog.Items)
        {
            _cardPanel.Controls.Add(CreateDemoCard(demo));
        }

        _statusLabel = new Label
        {
            Text = "Ready. Choose a destination to start Simla.",
            AutoSize = false,
            Dock = DockStyle.Fill,
            ForeColor = SecondaryText,
            Font = new Font("Segoe UI", 10.5F, FontStyle.Regular),
            TextAlign = ContentAlignment.MiddleLeft,
            Margin = new Padding(0)
        };

        libraryPanel.Controls.Add(_cardPanel, 0, 1);
        libraryPanel.Controls.Add(CreateStatusPanel(), 0, 2);

        shell.Controls.Add(heroPanel, 0, 0);
        shell.Controls.Add(libraryPanel, 1, 0);

        Controls.Add(shell);

        Resize += (_, _) => ResizeDemoCards();
        KeyDown += OnLauncherKeyDown;
        Load += (_, _) => ResizeDemoCards();
    }

    private Control CreateHeroPanel()
    {
        var panel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = SurfaceBackground,
            Padding = new Padding(40),
            RowCount = 7,
            ColumnCount = 1,
            Margin = new Padding(0, 0, 22, 0)
        };
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        panel.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        var badge = new Label
        {
            AutoSize = true,
            Text = "SIMLA CONTROL DECK",
            ForeColor = Accent,
            Font = new Font("Bahnschrift SemiBold", 12F, FontStyle.Bold),
            Margin = new Padding(0, 0, 0, 18)
        };

        var heading = new Label
        {
            AutoSize = true,
            Text = "Open the worlds, docs, and tools from one full-screen launcher.",
            ForeColor = PrimaryText,
            Font = new Font("Bahnschrift SemiBold", 27F, FontStyle.Bold),
            MaximumSize = new Size(480, 0),
            Margin = new Padding(0, 0, 0, 20)
        };

        var intro = new Label
        {
            AutoSize = true,
            Text = "Simla Launcher starts the local service when needed, then drops you straight into the experience you picked.",
            ForeColor = SecondaryText,
            Font = new Font("Segoe UI", 12F, FontStyle.Regular),
            MaximumSize = new Size(500, 0),
            Margin = new Padding(0, 0, 0, 28)
        };

        var highlights = new Label
        {
            AutoSize = true,
            Text = "Dark mode is the default. Press Escape to close this launcher at any time.",
            ForeColor = Color.FromArgb(200, 206, 220),
            Font = new Font("Segoe UI", 10.5F, FontStyle.Regular),
            MaximumSize = new Size(500, 0),
            Margin = new Padding(0, 0, 0, 0)
        };

        var quitButton = CreateActionButton("Exit Launcher", closeOnClick: true);
        quitButton.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
        quitButton.Margin = new Padding(0, 24, 0, 0);

        var footer = new Label
        {
            AutoSize = true,
            Text = "Local URLs: http://localhost:8080/*",
            ForeColor = SecondaryText,
            Font = new Font("Consolas", 10F, FontStyle.Regular),
            Margin = new Padding(0, 22, 0, 0)
        };

        panel.Controls.Add(badge, 0, 0);
        panel.Controls.Add(heading, 0, 1);
        panel.Controls.Add(intro, 0, 2);
        panel.Controls.Add(highlights, 0, 3);
        panel.Controls.Add(new Panel { Dock = DockStyle.Fill, BackColor = SurfaceBackground, Margin = new Padding(0) }, 0, 4);
        panel.Controls.Add(quitButton, 0, 5);
        panel.Controls.Add(footer, 0, 6);

        return panel;
    }

    private TableLayoutPanel CreateLibraryPanel()
    {
        var panel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            BackColor = SurfaceBackground,
            Padding = new Padding(34),
            RowCount = 3,
            ColumnCount = 1,
            Margin = new Padding(0)
        };
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        panel.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
        panel.RowStyles.Add(new RowStyle(SizeType.AutoSize));

        var header = new TableLayoutPanel
        {
            Dock = DockStyle.Top,
            ColumnCount = 1,
            RowCount = 2,
            AutoSize = true,
            BackColor = SurfaceBackground,
            Margin = new Padding(0, 0, 0, 24)
        };

        var title = new Label
        {
            AutoSize = true,
            Text = "Explore Simla",
            ForeColor = PrimaryText,
            Font = new Font("Bahnschrift SemiBold", 22F, FontStyle.Bold),
            Margin = new Padding(0, 0, 0, 10)
        };

        var subtitle = new Label
        {
            AutoSize = true,
            Text = "Each card opens a curated entry point. The launcher handles the local service startup behind the scenes.",
            ForeColor = SecondaryText,
            Font = new Font("Segoe UI", 11F, FontStyle.Regular),
            MaximumSize = new Size(900, 0),
            Margin = new Padding(0, 0, 0, 0)
        };

        header.Controls.Add(title, 0, 0);
        header.Controls.Add(subtitle, 0, 1);

        panel.Controls.Add(header, 0, 0);
        return panel;
    }

    private Control CreateStatusPanel()
    {
        var panel = new Panel
        {
            Height = 56,
            Dock = DockStyle.Fill,
            BackColor = AccentMuted,
            Padding = new Padding(18, 10, 18, 10),
            Margin = new Padding(0, 24, 0, 0)
        };

        panel.Controls.Add(_statusLabel);
        return panel;
    }

    private Control CreateDemoCard(DemoDefinition demo)
    {
        var card = new Panel
        {
            Height = 190,
            Width = 420,
            BackColor = CardBackground,
            BorderStyle = BorderStyle.FixedSingle,
            Margin = new Padding(0, 0, 18, 18),
            Padding = new Padding(22, 20, 22, 20),
            Tag = demo
        };

        var title = new Label
        {
            AutoSize = true,
            Text = demo.Title,
            ForeColor = PrimaryText,
            Font = new Font("Bahnschrift SemiBold", 18F, FontStyle.Bold),
            Location = new Point(0, 0),
            MaximumSize = new Size(330, 0)
        };

        var idTag = new Label
        {
            AutoSize = true,
            Text = demo.Id.ToUpperInvariant(),
            ForeColor = Accent,
            Font = new Font("Consolas", 9.5F, FontStyle.Bold),
            Location = new Point(0, 38)
        };

        var description = new Label
        {
            AutoSize = false,
            Text = demo.Description,
            ForeColor = SecondaryText,
            Font = new Font("Segoe UI", 10.5F, FontStyle.Regular),
            Location = new Point(0, 68),
            Size = new Size(360, 46)
        };

        var endpoint = new Label
        {
            AutoSize = true,
            Text = $"/{demo.Page}",
            ForeColor = Color.FromArgb(194, 201, 214),
            Font = new Font("Consolas", 10F, FontStyle.Regular),
            Location = new Point(0, 122)
        };

        var launchButton = CreateActionButton("Launch", closeOnClick: false);
        launchButton.Location = new Point(0, 144);
        launchButton.Click += async (_, _) => await LaunchFromFormAsync(demo);

        card.Controls.Add(title);
        card.Controls.Add(idTag);
        card.Controls.Add(description);
        card.Controls.Add(endpoint);
        card.Controls.Add(launchButton);
        return card;
    }

    private Button CreateActionButton(string text, bool closeOnClick)
    {
        var button = new Button
        {
            Text = text,
            AutoSize = false,
            Size = new Size(156, 38),
            BackColor = Accent,
            ForeColor = Color.FromArgb(10, 15, 24),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Bahnschrift SemiBold", 11F, FontStyle.Bold),
            Margin = new Padding(0)
        };

        button.FlatAppearance.BorderSize = 0;

        if (closeOnClick)
        {
            button.Click += (_, _) => Close();
        }

        return button;
    }

    private async Task LaunchFromFormAsync(DemoDefinition demo)
    {
        ToggleButtons(false);
        _statusLabel.Text = $"Opening {demo.Title} and checking the local Simla service...";

        try
        {
            await DemoServiceLauncher.LaunchAsync(demo);
            _statusLabel.Text = $"Opened {demo.Title}.";
        }
        catch (Exception ex)
        {
            _statusLabel.Text = "Launch failed.";
            MessageBox.Show(this, ex.Message, "Simla Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            ToggleButtons(true);
        }
    }

    private void ToggleButtons(bool enabled)
    {
        foreach (Control control in _cardPanel.Controls)
        {
            control.Enabled = enabled;
            foreach (Control child in control.Controls)
            {
                child.Enabled = enabled;
            }
        }
    }

    private void ResizeDemoCards()
    {
        if (_cardPanel.Width <= 0)
        {
            return;
        }

        var availableWidth = Math.Max(360, _cardPanel.ClientSize.Width - SystemInformation.VerticalScrollBarWidth - 12);
        var cardWidth = availableWidth >= 960 ? (availableWidth - 18) / 2 : availableWidth;

        foreach (Control control in _cardPanel.Controls)
        {
            control.Width = Math.Max(360, cardWidth);
        }
    }

    private void OnLauncherKeyDown(object? sender, KeyEventArgs e)
    {
        if (e.KeyCode == Keys.Escape)
        {
            Close();
        }
    }
}

internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        if (args.Length > 0 && DemoCatalog.TryGet(args[0], out var demo))
        {
            try
            {
                DemoServiceLauncher.LaunchAsync(demo).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Simla Launcher", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            return;
        }

        Application.Run(new LauncherForm());
    }
}